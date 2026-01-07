import { NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import CommunityPost from '@/models/CommunityPost';

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
