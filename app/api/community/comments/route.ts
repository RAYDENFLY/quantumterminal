import { NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import { getCurrentUser } from '@/lib/auth/session';
import { rateLimit } from '@/lib/rateLimit';
import CommunityPost from '@/models/CommunityPost';
import CommunityComment from '@/models/CommunityComment';
import User from '@/models/User';

export async function GET(req: Request) {
  await connectDB();
  const { searchParams } = new URL(req.url);
  const postId = (searchParams.get('postId') || '').trim();
  const limit = Math.min(100, Math.max(1, Number(searchParams.get('limit') || 50)));

  if (!postId) {
    return NextResponse.json({ success: false, error: 'Missing postId' }, { status: 400 });
  }

  const comments = await CommunityComment.find({ postId, status: 'active' })
    .sort({ createdAt: 1 })
    .limit(limit)
    .select({ postId: 1, parentCommentId: 1, authorId: 1, authorEmail: 1, body: 1, createdAt: 1 })
    .lean();

  const authorIds = Array.from(new Set(comments.map((c: any) => String(c.authorId)).filter(Boolean)));
  const users = await User.find({ _id: { $in: authorIds } })
    .select({ _id: 1, username: 1 })
    .lean();
  const userMap = new Map(users.map((u: any) => [String(u._id), u.username]));

  const commentsWithAuthor = comments.map((c: any) => ({
    ...c,
    authorUsername: userMap.get(String(c.authorId)) ?? null,
  }));

  return NextResponse.json({ success: true, comments: commentsWithAuthor });
}

export async function POST(req: Request) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
  }

  const rl = rateLimit(`community:comment:${user.id}`, 30, 60 * 60 * 1000); // 30/hour
  if (!rl.ok) {
    return NextResponse.json(
      { success: false, error: 'Rate limit exceeded. Please try again later.' },
      { status: 429 }
    );
  }

  const body = (await req.json().catch(() => null)) as
    | { postId?: string; body?: string; parentCommentId?: string | null }
    | null;

  const postId = (body?.postId ?? '').toString().trim();
  const content = (body?.body ?? '').toString().trim();
  const parentCommentId = (body?.parentCommentId ?? null) ? String(body?.parentCommentId) : null;

  if (!postId) {
    return NextResponse.json({ success: false, error: 'Missing postId' }, { status: 400 });
  }
  if (!content || content.length < 2 || content.length > 10000) {
    return NextResponse.json({ success: false, error: 'Comment must be 2-10000 chars.' }, { status: 400 });
  }

  await connectDB();

  const post = await CommunityPost.findById(postId).select({ _id: 1, status: 1 }).lean();
  if (!post) {
    return NextResponse.json({ success: false, error: 'Post not found' }, { status: 404 });
  }
  if ((post as any).status !== 'active') {
    return NextResponse.json({ success: false, error: 'Post is not available' }, { status: 403 });
  }

  const comment = await CommunityComment.create({
    postId,
    parentCommentId,
    authorId: user.id,
    authorEmail: user.email,
    body: content,
  });

  await CommunityPost.updateOne(
    { _id: postId },
    { $inc: { commentsCount: 1 }, $set: { lastCommentAt: new Date() } }
  );

  return NextResponse.json({
    success: true,
    comment: {
      id: String(comment._id),
      postId: String(comment.postId),
      authorEmail: comment.authorEmail,
      body: comment.body,
      createdAt: comment.createdAt,
    },
  });
}
