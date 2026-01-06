import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import DonationLog from '@/models/DonationLog';
import { withAuth } from '@/lib/auth';

export const runtime = 'nodejs';

// GET /api/admin/donation-logs - list logs (admin)
export const GET = withAuth(async (_request: NextRequest) => {
  try {
    await connectDB();

    const logs = await DonationLog.find({})
      .sort({ period: -1 })
      .lean();

    return NextResponse.json({ success: true, data: logs });
  } catch (error) {
    console.error('Error fetching admin donation logs:', error);
    return NextResponse.json({ success: false, error: 'Failed to fetch donation logs' }, { status: 500 });
  }
});

// POST /api/admin/donation-logs - upsert one period (admin)
export const POST = withAuth(async (request: NextRequest, user) => {
  try {
    await connectDB();

    const body = await request.json();

    const period = String(body?.period ?? '').trim();
    if (!period || !/^\d{4}-\d{2}$/.test(period)) {
      return NextResponse.json({ success: false, error: 'Invalid period. Use YYYY-MM.' }, { status: 400 });
    }

    // Hard requirement: only single donation wallet is supported.
    const donationWallet = String(body?.donationWallet ?? '').trim();
    if (!donationWallet) {
      return NextResponse.json({ success: false, error: 'donationWallet is required' }, { status: 400 });
    }

    const update = {
      period,
      network: 'BSC',
      donationWallet,
      summary: body?.summary ?? {},
      outgoing: Array.isArray(body?.outgoing) ? body.outgoing : [],
      incoming: body?.incoming ?? { mode: 'summary', explorerUrl: body?.incoming?.explorerUrl },
      notes: body?.notes ?? undefined,
      publishedAt: body?.publishedAt ? new Date(body.publishedAt) : undefined,
    };

    const saved = await DonationLog.findOneAndUpdate(
      { period },
      { $set: update },
      { upsert: true, new: true, runValidators: true }
    ).lean();

    // Optional: could also write to AuditLog; not required here.
    return NextResponse.json({ success: true, data: saved, meta: { updatedBy: user.email } });
  } catch (error) {
    console.error('Error upserting donation log:', error);
    return NextResponse.json({ success: false, error: 'Failed to save donation log' }, { status: 500 });
  }
});
