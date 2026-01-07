import { NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import { getCurrentUser } from '@/lib/auth/session';
import CommunityPost from '@/models/CommunityPost';
import CommunityVote from '@/models/CommunityVote';

export async function GET(_req: Request, ctx: { params: Promise<{ slug: string }> }) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ success: true, voted: false });
  }

  await connectDB();
  const { slug } = await ctx.params;

  const post = await CommunityPost.findOne({ slug, status: 'active' }).select({ _id: 1 }).lean();
  if (!post) {
    return NextResponse.json({ success: false, error: 'Not found' }, { status: 404 });
  }

  const exists = await CommunityVote.findOne({ targetType: 'post', targetId: post._id, userId: user.id })
    .select({ _id: 1 })
    .lean();

  return NextResponse.json({ success: true, voted: Boolean(exists) });
}

export async function POST(_req: Request, ctx: { params: Promise<{ slug: string }> }) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
  }

  await connectDB();
  const { slug } = await ctx.params;

  const post = await CommunityPost.findOne({ slug, status: 'active' }).select({ _id: 1 }).lean();
  if (!post) {
    return NextResponse.json({ success: false, error: 'Not found' }, { status: 404 });
  }

  try {
    await CommunityVote.create({ targetType: 'post', targetId: post._id, userId: user.id });
  } catch (e: any) {
    // Duplicate key => already voted
    if (e?.code !== 11000) {
      console.error('Vote create error:', e);
    }
  }

  // Make counter eventually-consistent (avoid $inc if already existed)
  const count = await CommunityVote.countDocuments({ targetType: 'post', targetId: post._id });
  await CommunityPost.updateOne({ _id: post._id }, { $set: { upvotesCount: count } });

  return NextResponse.json({ success: true, voted: true, upvotesCount: count });
 }

export async function DELETE(_req: Request, ctx: { params: Promise<{ slug: string }> }) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
  }

  await connectDB();
  const { slug } = await ctx.params;

  const post = await CommunityPost.findOne({ slug, status: 'active' }).select({ _id: 1 }).lean();
  if (!post) {
    return NextResponse.json({ success: false, error: 'Not found' }, { status: 404 });
  }

  await CommunityVote.deleteOne({ targetType: 'post', targetId: post._id, userId: user.id });

  const count = await CommunityVote.countDocuments({ targetType: 'post', targetId: post._id });
  await CommunityPost.updateOne({ _id: post._id }, { $set: { upvotesCount: count } });

  return NextResponse.json({ success: true, voted: false, upvotesCount: count });
}
