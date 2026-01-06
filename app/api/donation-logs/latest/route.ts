import { NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import DonationLog from '@/models/DonationLog';

export const runtime = 'nodejs';

// GET /api/donation-logs/latest
// Public endpoint: returns the latest donation log (by period)
export async function GET() {
  try {
    await connectDB();

    const latest = await DonationLog.findOne({})
      .sort({ period: -1 })
      .lean();

    return NextResponse.json({ success: true, data: latest ?? null });
  } catch (error) {
    console.error('Error fetching latest donation log:', error);
    return NextResponse.json({ success: false, error: 'Failed to fetch latest donation log' }, { status: 500 });
  }
}
