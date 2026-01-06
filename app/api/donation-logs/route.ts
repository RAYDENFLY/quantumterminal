import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import DonationLog from '@/models/DonationLog';

export const runtime = 'nodejs';

// GET /api/donation-logs
// Public endpoint: lists available logs (most recent first)
export async function GET(request: NextRequest) {
  try {
    await connectDB();

    const { searchParams } = new URL(request.url);
    const limit = Math.min(Math.max(Number(searchParams.get('limit') ?? '24') || 24, 1), 60);

    const logs = await DonationLog.find({})
      .sort({ period: -1 })
      .limit(limit)
      .select({
        period: 1,
        network: 1,
        donationWallet: 1,
        summary: 1,
        publishedAt: 1,
        updatedAt: 1,
        createdAt: 1,
      })
      .lean();

    return NextResponse.json({ success: true, data: logs });
  } catch (error) {
    console.error('Error fetching donation logs:', error);
    return NextResponse.json({ success: false, error: 'Failed to fetch donation logs' }, { status: 500 });
  }
}
