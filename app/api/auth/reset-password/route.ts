import crypto from 'crypto';
import bcrypt from 'bcryptjs';
import { NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import User from '@/models/User';
import PasswordResetToken from '@/models/PasswordResetToken';

function sha256Hex(input: string) {
  return crypto.createHash('sha256').update(input).digest('hex');
}

export async function POST(req: Request) {
  await connectDB();

  const body = (await req.json().catch(() => null)) as
    | { email?: string; token?: string; password?: string }
    | null;

  const email = (body?.email ?? '').toString().trim().toLowerCase();
  const token = (body?.token ?? '').toString().trim();
  const password = (body?.password ?? '').toString();

  if (!email || !email.includes('@')) {
    return NextResponse.json({ success: false, error: 'Invalid email.' }, { status: 400 });
  }
  if (!token || token.length < 10) {
    return NextResponse.json({ success: false, error: 'Invalid token.' }, { status: 400 });
  }
  if (!password || password.length < 10) {
    return NextResponse.json({ success: false, error: 'Password must be at least 10 characters.' }, { status: 400 });
  }

  const user = await User.findOne({ email }).select({ _id: 1 }).lean();
  if (!user) {
    // Avoid user enumeration (still reject since reset token must match a user)
    return NextResponse.json({ success: false, error: 'Invalid reset request.' }, { status: 400 });
  }

  const tokenHash = sha256Hex(token);
  const prt = await PasswordResetToken.findOne({ tokenHash, userId: user._id })
    .select({ _id: 1, expiresAt: 1, usedAt: 1 })
    .lean();

  if (!prt) {
    return NextResponse.json({ success: false, error: 'Invalid or expired token.' }, { status: 400 });
  }
  if (prt.usedAt) {
    return NextResponse.json({ success: false, error: 'Token already used.' }, { status: 400 });
  }
  if (new Date(prt.expiresAt).getTime() < Date.now()) {
    return NextResponse.json({ success: false, error: 'Token expired.' }, { status: 400 });
  }

  const passwordHash = await bcrypt.hash(password, 10);
  await User.updateOne({ _id: user._id }, { $set: { passwordHash } });
  await PasswordResetToken.updateOne({ _id: prt._id }, { $set: { usedAt: new Date() } });

  return NextResponse.json({ success: true });
}
