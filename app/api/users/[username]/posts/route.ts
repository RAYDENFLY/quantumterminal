import { NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import User from '@/models/User';
import CommunityPost from '@/models/CommunityPost';
import { getCurrentUser } from '@/lib/auth/session';

function normalizeUsername(username: string) {
  return username.trim().toLowerCase();
}

export async function GET(
  _req: Request,
  ctx: { params: Promise<{ username: string }> }
) {
  try {
    await connectDB();

    const sessionUser = await getCurrentUser();
    if (!sessionUser) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const { username } = await ctx.params;
    const u = normalizeUsername(username);

    const user = await User.findOne({ username: u }).select({ _id: 1 }).lean();
    if (!user) {
      return NextResponse.json({ success: false, error: 'Not found' }, { status: 404 });
    }

    // Owner-only list
    if (String(user._id) !== sessionUser.id) {
      return NextResponse.json({ success: false, error: 'Forbidden' }, { status: 403 });
    }

    const posts = await CommunityPost.find({ authorId: user._id, status: { $ne: 'deleted' } })
      .sort({ createdAt: -1 })
      .limit(50)
      .select({
        _id: 1,
        slug: 1,
        title: 1,
        category: 1,
        coinTags: 1,
        createdAt: 1,
        upvotesCount: 1,
        commentsCount: 1,
        status: 1,
      })
      .lean();

    return NextResponse.json({ success: true, posts });
  } catch (error) {
    console.error('User posts GET error:', error);
    return NextResponse.json({ success: false, error: 'Failed to load posts.' }, { status: 500 });
  }
}
