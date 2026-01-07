import { NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import User from '@/models/User';
import CommunityPost from '@/models/CommunityPost';
import CommunityComment from '@/models/CommunityComment';
import { getCurrentUser } from '@/lib/auth/session';

function normalizeUsername(username: string) {
  return username.trim().toLowerCase();
}

function safeBio(bio: unknown) {
  if (typeof bio !== 'string') return '';
  // Text-only; trim and strip control chars.
  return bio.replace(/[\u0000-\u001F\u007F]/g, '').trim().slice(0, 280);
}

function safeUsername(username: unknown) {
  if (typeof username !== 'string') return '';
  const u = normalizeUsername(username);
  if (u.length < 3 || u.length > 24) return '';
  if (!/^[a-z0-9_]+$/.test(u)) return '';
  return u;
}

type CoinTagAgg = {
  coinId: string;
  symbol: string;
  name: string;
  count: number;
};

export async function GET(
  _req: Request,
  ctx: { params: Promise<{ username: string }> }
) {
  try {
    await connectDB();
    const { username } = await ctx.params;
    const u = normalizeUsername(username);

    const user = await User.findOne({ username: u })
      .select({ _id: 1, username: 1, bio: 1, createdAt: 1 })
      .lean();

    if (!user) {
      return NextResponse.json({ success: false, error: 'Not found' }, { status: 404 });
    }

    const [postsCount, commentsCount, topCoinsRaw] = await Promise.all([
      CommunityPost.countDocuments({ authorId: user._id, status: { $ne: 'deleted' } }),
      CommunityComment.countDocuments({ authorId: user._id, status: { $ne: 'deleted' } }),
      CommunityPost.aggregate<CoinTagAgg>([
        { $match: { authorId: user._id, status: { $ne: 'deleted' } } },
        { $unwind: '$coinTags' },
        {
          $group: {
            _id: {
              coinId: '$coinTags.coinId',
              symbol: '$coinTags.symbol',
              name: '$coinTags.name',
            },
            count: { $sum: 1 },
          },
        },
        { $sort: { count: -1 } },
        { $limit: 8 },
        {
          $project: {
            _id: 0,
            coinId: '$_id.coinId',
            symbol: '$_id.symbol',
            name: '$_id.name',
            count: 1,
          },
        },
      ]),
    ]);

    return NextResponse.json({
      success: true,
      profile: {
        username: user.username,
        bio: user.bio ?? '',
        joinDate: user.createdAt,
        stats: {
          posts: postsCount,
          comments: commentsCount,
        },
        topCoins: topCoinsRaw,
      },
    });
  } catch (error) {
    console.error('Profile GET error:', error);
    return NextResponse.json({ success: false, error: 'Failed to load profile.' }, { status: 500 });
  }
}

export async function PATCH(
  req: Request,
  ctx: { params: Promise<{ username: string }> }
) {
  try {
    await connectDB();

    const sessionUser = await getCurrentUser();
    if (!sessionUser) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const { username } = await ctx.params;
    const target = normalizeUsername(username);

    const user = await User.findOne({ username: target }).select({ _id: 1, email: 1 }).lean();
    if (!user) {
      return NextResponse.json({ success: false, error: 'Not found' }, { status: 404 });
    }

    // Owner-only (admin can be allowed later if needed)
    if (String(user._id) !== sessionUser.id) {
      return NextResponse.json({ success: false, error: 'Forbidden' }, { status: 403 });
    }

    const body = (await req.json()) as { username?: string; bio?: string };
    const nextUsername = body.username !== undefined ? safeUsername(body.username) : '';
    const nextBio = body.bio !== undefined ? safeBio(body.bio) : undefined;

    if (body.username !== undefined && !nextUsername) {
      return NextResponse.json(
        {
          success: false,
          error: 'Username must be 3-24 chars and contain only lowercase letters, numbers, and underscores.',
        },
        { status: 400 }
      );
    }

    if (nextUsername && nextUsername !== target) {
      const exists = await User.findOne({ username: nextUsername }).select({ _id: 1 }).lean();
      if (exists) {
        return NextResponse.json(
          { success: false, error: 'Username is already taken.' },
          { status: 409 }
        );
      }
    }

    const update: Record<string, unknown> = {};
    if (body.username !== undefined) update.username = nextUsername;
    if (body.bio !== undefined) update.bio = nextBio ?? '';

    await User.updateOne({ _id: user._id }, { $set: update });

    const updated = await User.findById(user._id)
      .select({ username: 1, bio: 1, createdAt: 1 })
      .lean();

    return NextResponse.json({
      success: true,
      profile: {
        username: updated?.username,
        bio: updated?.bio ?? '',
        joinDate: updated?.createdAt,
      },
    });
  } catch (error) {
    console.error('Profile PATCH error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to update profile.' },
      { status: 500 }
    );
  }
}
