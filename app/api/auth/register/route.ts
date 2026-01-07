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

    if (password.length < 10) {
      return NextResponse.json(
        { success: false, error: 'Password must be at least 10 characters.' },
        { status: 400 }
      );
    }

    const existing = await User.findOne({ email }).select({ _id: 1 }).lean();
    if (existing) {
      return NextResponse.json(
        { success: false, error: 'Email is already registered.' },
        { status: 409 }
      );
    }

    const passwordHash = await bcrypt.hash(password, 12);
    const user = await User.create({ email, passwordHash, role: 'user' });

    // Auto-login after registration
    try {
      await createSession(String(user._id), 7);
    } catch {
      // If SESSION_SECRET isn't set (e.g. dev), still allow registration.
    }

    return NextResponse.json(
      {
        success: true,
        data: {
          id: String(user._id),
          email: user.email,
        },
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Register error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to register.' },
      { status: 500 }
    );
  }
}
