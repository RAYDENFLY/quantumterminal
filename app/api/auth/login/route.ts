import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import connectDB from '@/lib/mongodb';
import User from '@/models/User';
import { createSession } from '@/lib/auth/session';

function normalizeEmail(email: string) {
  return email.trim().toLowerCase();
}

export async function POST(req: Request) {
  try {
    await connectDB();

    const body = (await req.json()) as { email?: string; password?: string };
    const email = body.email ? normalizeEmail(body.email) : '';
    const password = body.password ?? '';

    if (!email || !password) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields: email, password' },
        { status: 400 }
      );
    }

    const user = await User.findOne({ email }).lean();

    // Avoid account enumeration: generic error
    if (!user?.passwordHash) {
      return NextResponse.json(
        { success: false, error: 'Invalid credentials.' },
        { status: 401 }
      );
    }

    const ok = await bcrypt.compare(password, user.passwordHash);
    if (!ok) {
      return NextResponse.json(
        { success: false, error: 'Invalid credentials.' },
        { status: 401 }
      );
    }

    await User.updateOne({ _id: user._id }, { $set: { lastLoginAt: new Date() } });

    try {
      await createSession(String(user._id), 7);
    } catch (e) {
      // If SESSION_SECRET isn't set, fail closed for login.
      return NextResponse.json(
        {
          success: false,
          error: 'Server auth is not configured (missing SESSION_SECRET).',
        },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      data: {
        id: String(user._id),
        email: user.email,
      },
    });
  } catch (error) {
    console.error('Login error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to login.' },
      { status: 500 }
    );
  }
}
