import crypto from 'crypto';
import { NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import { getCurrentUser } from '@/lib/auth/session';
import { rateLimit } from '@/lib/rateLimit';
import { uniqueSlug } from '@/lib/slug';
import CommunityPost, { COMMUNITY_CATEGORIES, type CommunityCategory } from '@/models/CommunityPost';

function randomSuffix() {
  return crypto.randomBytes(4).toString('hex');
}

export async function GET(req: Request) {
  await connectDB();

  const { searchParams } = new URL(req.url);
  const category = (searchParams.get('category') || '').toLowerCase();
  const q = (searchParams.get('q') || '').trim();
  const limit = Math.min(50, Math.max(1, Number(searchParams.get('limit') || 20)));
  const cursor = (searchParams.get('cursor') || '').trim(); // ISO string; meaning depends on sort
  const sort = (searchParams.get('sort') || 'newest').toLowerCase();

  const filter: any = { status: 'active' };
  if (category && (COMMUNITY_CATEGORIES as readonly string[]).includes(category)) {
    filter.category = category as CommunityCategory;
  }

  if (q) {
    // simple title search (lightweight)
    filter.title = { $regex: q.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), $options: 'i' };
  }

  let sortSpec: Record<string, 1 | -1> = { createdAt: -1 };

  if (sort === 'top_all' || sort === 'top') {
    // deterministic ordering for pagination
    sortSpec = { upvotesCount: -1, createdAt: -1 };
  } else if (sort === 'top_24h') {
    sortSpec = { upvotesCount: -1, createdAt: -1 };
    filter.createdAt = { $gte: new Date(Date.now() - 24 * 60 * 60 * 1000) };
  } else {
    // newest
    sortSpec = { createdAt: -1 };
  }

  if (cursor) {
    if (sort === 'top_all' || sort === 'top' || sort === 'top_24h') {
      // cursor format: `${upvotesCount}|${createdAtISO}`
      const [votesRaw, createdAtRaw] = cursor.split('|');
      const cursorVotes = Number(votesRaw);
      const cursorDt = new Date(createdAtRaw);
      if (!Number.isNaN(cursorVotes) && !Number.isNaN(cursorDt.getTime())) {
        // items after cursor = lower votes OR same votes but older
        filter.$or = [
          { upvotesCount: { $lt: cursorVotes } },
          { upvotesCount: cursorVotes, createdAt: { $lt: cursorDt } },
        ];
      }
    } else {
      const dt = new Date(cursor);
      if (!Number.isNaN(dt.getTime())) {
        filter.createdAt = { $lt: dt };
      }
    }
  }

  const posts = await CommunityPost.find(filter)
    .sort(sortSpec)
    .limit(limit)
    .select({
      title: 1,
      slug: 1,
      category: 1,
      coinTags: 1,
      authorEmail: 1,
      commentsCount: 1,
      upvotesCount: 1,
      createdAt: 1,
      lastCommentAt: 1,
    })
    .lean();

  const nextCursor = posts.length
    ? (() => {
        const last: any = posts[posts.length - 1];
        if (sort === 'top_all' || sort === 'top' || sort === 'top_24h') {
          return `${Number(last.upvotesCount ?? 0)}|${new Date(last.createdAt).toISOString()}`;
        }
        return new Date(last.createdAt).toISOString();
      })()
    : null;

  return NextResponse.json({ success: true, posts, nextCursor });
}

export async function POST(req: Request) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
  }

  const rl = rateLimit(`community:post:${user.id}`, 5, 60 * 60 * 1000); // 5 posts/hour
  if (!rl.ok) {
    return NextResponse.json(
      { success: false, error: 'Rate limit exceeded. Please try again later.' },
      { status: 429 }
    );
  }

  const body = (await req.json().catch(() => null)) as
    | { title?: string; body?: string; category?: string; coinTags?: Array<any> }
    | null;

  const title = (body?.title ?? '').toString().trim();
  const content = (body?.body ?? '').toString().trim();
  const categoryRaw = (body?.category ?? '').toString().trim().toLowerCase();

  if (!title || title.length < 4 || title.length > 120) {
    return NextResponse.json({ success: false, error: 'Title must be 4-120 chars.' }, { status: 400 });
  }
  if (!content || content.length < 10 || content.length > 20000) {
    return NextResponse.json({ success: false, error: 'Body must be 10-20000 chars.' }, { status: 400 });
  }
  if (!(COMMUNITY_CATEGORIES as readonly string[]).includes(categoryRaw)) {
    return NextResponse.json({ success: false, error: 'Invalid category.' }, { status: 400 });
  }

  const rawTags = Array.isArray(body?.coinTags) ? body!.coinTags : [];
  const coinTags = rawTags
    .filter((t) => t && typeof t === 'object')
    .slice(0, 5)
    .map((t) => ({
      coinId: String(t.coinId || t.id || '').trim(),
      symbol: String(t.symbol || '').trim(),
      name: String(t.name || '').trim(),
      image: String(t.image || '').trim(),
    }))
    .filter((t) => t.coinId && t.symbol && t.name);

  await connectDB();

  const slug = uniqueSlug(title, randomSuffix());

  const post = await CommunityPost.create({
    authorId: user.id,
    authorEmail: user.email,
    category: categoryRaw,
    title,
    body: content,
    coinTags,
    slug,
  });

  return NextResponse.json({ success: true, post: { id: String(post._id), slug: post.slug } });
}
