import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import AuditLog from '@/models/AuditLog';
import { withAuth } from '@/lib/auth';

// GET /api/admin/logs - Get audit logs
export const GET = withAuth(async (request: NextRequest) => {
  try {
    await connectDB();

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const action = searchParams.get('action');
    const targetType = searchParams.get('targetType');
    const adminEmail = searchParams.get('adminEmail');
    const skip = (page - 1) * limit;

    // Build filter
    const filter: any = {};
    if (action) filter.action = action;
    if (targetType) filter.targetType = targetType;
    if (adminEmail) filter.adminEmail = adminEmail;

    // Get logs
    const logs = await AuditLog.find(filter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean();

    const total = await AuditLog.countDocuments(filter);

    // Get unique admin emails for filter
    const uniqueAdmins = await AuditLog.distinct('adminEmail');

    // Get stats
    const stats = await AuditLog.aggregate([
      {
        $group: {
          _id: '$action',
          count: { $sum: 1 }
        }
      }
    ]);

    return NextResponse.json({
      success: true,
      data: {
        logs,
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit)
        },
        stats: {
          totalLogs: total,
          actionCounts: stats.reduce((acc: any, stat: any) => {
            acc[stat._id] = stat.count;
            return acc;
          }, {
            approve: 0,
            reject: 0,
            delete: 0,
            create: 0,
            update: 0
          })
        },
        filters: {
          admins: uniqueAdmins
        }
      }
    });

  } catch (error) {
    console.error('Error fetching audit logs:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch audit logs' },
      { status: 500 }
    );
  }
});

// POST /api/admin/logs - Create audit log (internal use)
export const POST = withAuth(async (request: NextRequest) => {
  try {
    await connectDB();

    const body = await request.json();
    const {
      adminId,
      adminEmail,
      action,
      targetType,
      targetId,
      targetTitle,
      reason,
      details,
      ipAddress,
      userAgent
    } = body;

    const log = new AuditLog({
      adminId,
      adminEmail,
      action,
      targetType,
      targetId,
      targetTitle,
      reason,
      details,
      ipAddress,
      userAgent
    });

    await log.save();

    return NextResponse.json({
      success: true,
      data: log
    });

  } catch (error) {
    console.error('Error creating audit log:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to create audit log' },
      { status: 500 }
    );
  }
});
