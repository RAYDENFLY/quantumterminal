import { NextResponse } from 'next/server';
import mongoose from 'mongoose';
import connectDB from '@/lib/mongodb';
import CommunityPost, { COMMUNITY_CATEGORIES, type CommunityCategory } from '@/models/CommunityPost';
import { getCurrentUser } from '@/lib/auth/session';

export async function GET(_req: Request, ctx: { params: Promise<{ slug: string }> }) {
  await connectDB();
  const { slug } = await ctx.params;

  const post = await CommunityPost.findOne({ slug, status: 'active' })
    .select({
      title: 1,
      body: 1,
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

  if (!post) {
    return NextResponse.json({ success: false, error: 'Not found' }, { status: 404 });
  }

  return NextResponse.json({ success: true, post });
}

export async function PATCH(req: Request, ctx: { params: Promise<{ slug: string }> }) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
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
  const { slug } = await ctx.params;

  const post = await CommunityPost.findOne({ slug }).select({ authorId: 1, status: 1 }).lean();
  if (!post || post.status === 'deleted') {
    return NextResponse.json({ success: false, error: 'Not found' }, { status: 404 });
  }

  const isOwner = String(post.authorId) === user.id;
  const isAdmin = user.role === 'admin';
  if (!isOwner && !isAdmin) {
    return NextResponse.json({ success: false, error: 'Forbidden' }, { status: 403 });
  }

  await CommunityPost.updateOne(
    { slug },
    {
      $set: {
        title,
        body: content,
        category: categoryRaw as CommunityCategory,
        coinTags,
      },
    }
  );

  return NextResponse.json({ success: true });
}

export async function DELETE(_req: Request, ctx: { params: Promise<{ slug: string }> }) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
  }

  await connectDB();
  const { slug } = await ctx.params;

  const post = await CommunityPost.findOne({ slug }).select({ _id: 1, authorId: 1, status: 1 }).lean();
  if (!post || post.status === 'deleted') {
    return NextResponse.json({ success: false, error: 'Not found' }, { status: 404 });
  }

  const isOwner = String(post.authorId) === user.id;
  const isAdmin = user.role === 'admin';
  if (!isOwner && !isAdmin) {
    return NextResponse.json({ success: false, error: 'Forbidden' }, { status: 403 });
  }

  await CommunityPost.updateOne(
    { _id: new mongoose.Types.ObjectId(String(post._id)) },
    {
      $set: {
        status: 'deleted',
        title: '[deleted]',
        body: '',
        coinTags: [],
      },
    }
  );

  return NextResponse.json({ success: true });
}
