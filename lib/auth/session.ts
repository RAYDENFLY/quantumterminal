import crypto from 'crypto';
import { cookies } from 'next/headers';
import connectDB from '@/lib/mongodb';
import Session from '@/models/Session';
import User from '@/models/User';

const COOKIE_NAME = 'qt_session';

export type SessionUser = {
  id: string;
  email: string;
  role: 'user' | 'admin';
};

function requireSessionSecret() {
  const secret = process.env.SESSION_SECRET;
  if (!secret) {
    throw new Error('Missing env var: SESSION_SECRET');
  }
  return secret;
}

function sha256Hex(input: string) {
  return crypto.createHash('sha256').update(input).digest('hex');
}

function randomToken() {
  // 32 bytes => 64 hex chars
  return crypto.randomBytes(32).toString('hex');
}

export async function getSessionCookieToken(): Promise<string | null> {
  const jar = await cookies();
  return jar.get(COOKIE_NAME)?.value ?? null;
}

export async function createSession(userId: string, days = 7) {
  requireSessionSecret(); // ensures env is set in prod
  await connectDB();

  const token = randomToken();
  const tokenHash = sha256Hex(token);
  const expiresAt = new Date(Date.now() + days * 24 * 60 * 60 * 1000);

  await Session.create({ tokenHash, userId, expiresAt });

  const jar = await cookies();
  jar.set({
    name: COOKIE_NAME,
    value: token,
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    expires: expiresAt,
  });

  return { token, expiresAt };
}

export async function destroySession() {
  await connectDB();

  const token = await getSessionCookieToken();
  if (token) {
    const tokenHash = sha256Hex(token);
    await Session.deleteOne({ tokenHash });
  }

  const jar = await cookies();
  jar.set({
    name: COOKIE_NAME,
    value: '',
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    expires: new Date(0),
  });
}

export async function getCurrentUser(): Promise<SessionUser | null> {
  await connectDB();

  const token = await getSessionCookieToken();
  if (!token) return null;

  const tokenHash = sha256Hex(token);

  const session = await Session.findOne({ tokenHash })
    .select({ userId: 1, expiresAt: 1 })
    .lean();

  if (!session) return null;
  if (new Date(session.expiresAt).getTime() < Date.now()) return null;

  const user = await User.findById(session.userId)
    .select({ email: 1, role: 1 })
    .lean();

  if (!user) return null;

  return {
    id: String(user._id),
    email: user.email,
    role: (user.role as 'user' | 'admin') ?? 'user',
  };
}
