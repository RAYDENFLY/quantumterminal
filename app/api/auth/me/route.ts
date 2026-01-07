import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth/session';
import User from '@/models/User';
import connectDB from '@/lib/mongodb';

export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ success: true, user: null });
    }

    // Enrich session user with username for UX (no extra private fields).
    await connectDB();
    const dbUser = await User.findById(user.id).select({ username: 1 }).lean();

    return NextResponse.json({
      success: true,
      user: {
        ...user,
        username: dbUser?.username ?? undefined,
      },
    });
  } catch (error) {
    console.error('Me error:', error);
    return NextResponse.json({ success: false, user: null }, { status: 200 });
  }
}
