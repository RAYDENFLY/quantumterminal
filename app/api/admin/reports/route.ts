import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import { withAuth } from '@/lib/auth';
import CommunityReport from '@/models/CommunityReport';
import CommunityPost from '@/models/CommunityPost';
import CommunityComment from '@/models/CommunityComment';

function excerpt(text: string, maxLen: number) {
  const s = (text || '').toString().replace(/\s+/g, ' ').trim();
  if (s.length <= maxLen) return s;
  return `${s.slice(0, Math.max(0, maxLen - 1))}…`;
}

// GET /api/admin/reports - list community reports (admin)
export const GET = withAuth(async (request: NextRequest) => {
  try {
    await connectDB();

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = Math.min(50, Math.max(1, parseInt(searchParams.get('limit') || '20')));
    const status = searchParams.get('status');
    const reason = searchParams.get('reason');
    const targetType = searchParams.get('targetType');
    const skip = (page - 1) * limit;

    const filter: any = {};
    if (status) filter.status = status;
    if (reason) filter.reason = reason;
    if (targetType) filter.targetType = targetType;

    const reports = await CommunityReport.find(filter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean();

    // Hydrate report targets with a lightweight preview (bulk fetch to keep it fast).
    const postIds = reports
      .filter((r: any) => r.targetType === 'post')
      .map((r: any) => r.targetId)
      .filter(Boolean);

    const commentIds = reports
      .filter((r: any) => r.targetType === 'comment')
      .map((r: any) => r.targetId)
      .filter(Boolean);

    const [posts, comments] = await Promise.all([
      postIds.length
        ? CommunityPost.find({ _id: { $in: postIds } })
            .select({ title: 1, body: 1, slug: 1, status: 1, createdAt: 1 })
            .lean()
        : Promise.resolve([]),
      commentIds.length
        ? CommunityComment.find({ _id: { $in: commentIds } })
            .select({ body: 1, postId: 1, status: 1, createdAt: 1 })
            .lean()
        : Promise.resolve([]),
    ]);

    const postById = new Map<string, any>(posts.map((p: any) => [String(p._id), p]));
    const commentById = new Map<string, any>(comments.map((c: any) => [String(c._id), c]));

    // For comment reports, also fetch parent post slug so we can deep-link.
    const commentPostIds = Array.from(new Set(comments.map((c: any) => String(c.postId)).filter(Boolean)));
    const commentPosts = commentPostIds.length
      ? await CommunityPost.find({ _id: { $in: commentPostIds } }).select({ slug: 1, status: 1 }).lean()
      : [];
    const commentPostById = new Map<string, any>(commentPosts.map((p: any) => [String(p._id), p]));

    const enrichedReports = reports.map((r: any) => {
      if (r.targetType === 'post') {
        const p = postById.get(String(r.targetId));
        return {
          ...r,
          targetPreview: p
            ? {
                title: p.title,
                excerpt: excerpt(p.body, 180),
                slug: p.slug,
                status: p.status,
                createdAt: p.createdAt,
              }
            : { missing: true },
        };
      }

      const c = commentById.get(String(r.targetId));
      const parentPost = c ? commentPostById.get(String(c.postId)) : null;

      return {
        ...r,
        targetPreview: c
          ? {
              excerpt: excerpt(c.body, 180),
              postId: String(c.postId),
              postSlug: parentPost?.slug ?? null,
              status: c.status,
              createdAt: c.createdAt,
            }
          : { missing: true },
      };
    });

    const total = await CommunityReport.countDocuments(filter);

    return NextResponse.json({
      success: true,
      data: {
  reports: enrichedReports,
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit),
        },
      },
    });
  } catch (error) {
    console.error('Error fetching reports:', error);
    return NextResponse.json({ success: false, error: 'Failed to fetch reports' }, { status: 500 });
  }
});

// PATCH /api/admin/reports - update report status
export const PATCH = withAuth(async (request: NextRequest) => {
  try {
    await connectDB();

    const body = (await request.json().catch(() => null)) as
      | {
          reportId?: string;
          status?: 'open' | 'reviewed' | 'dismissed';
          action?: 'hide_target' | 'delete_target';
        }
      | null;

    const reportId = (body?.reportId ?? '').toString().trim();
    const status = body?.status;
    const action = body?.action;

    if (!reportId) {
      return NextResponse.json({ success: false, error: 'Missing reportId' }, { status: 400 });
    }
    if (status && !(status === 'open' || status === 'reviewed' || status === 'dismissed')) {
      return NextResponse.json({ success: false, error: 'Invalid status' }, { status: 400 });
    }

    if (action && !(action === 'hide_target' || action === 'delete_target')) {
      return NextResponse.json({ success: false, error: 'Invalid action' }, { status: 400 });
    }

    const report = await CommunityReport.findById(reportId).lean();
    if (!report) {
      return NextResponse.json({ success: false, error: 'Report not found' }, { status: 404 });
    }

    if (action) {
      const nextStatusForTarget = action === 'hide_target' ? 'hidden' : 'deleted';
      if (report.targetType === 'post') {
        await CommunityPost.updateOne({ _id: report.targetId }, { $set: { status: nextStatusForTarget } });
      } else if (report.targetType === 'comment') {
        await CommunityComment.updateOne({ _id: report.targetId }, { $set: { status: nextStatusForTarget } });
      }
    }

    if (status) {
      await CommunityReport.updateOne({ _id: reportId }, { $set: { status } });
    } else if (action) {
      // If admin takes action but didn't specify a status, mark reviewed by default.
      await CommunityReport.updateOne({ _id: reportId }, { $set: { status: 'reviewed' } });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error updating report:', error);
    return NextResponse.json({ success: false, error: 'Failed to update report' }, { status: 500 });
  }
});
