import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth/session';

export async function GET() {
  try {
    const user = await getCurrentUser();
    return NextResponse.json({ success: true, user });
  } catch (error) {
    console.error('Me error:', error);
    return NextResponse.json({ success: false, user: null }, { status: 200 });
  }
}
