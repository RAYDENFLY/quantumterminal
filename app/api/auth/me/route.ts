import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth/session';
import User from '@/models/User';
import connectDB from '@/lib/mongodb';

function slugifyUsername(input: string) {
  return input
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9_]+/g, '_')
    .replace(/^_+|_+$/g, '')
    .slice(0, 24);
}

async function generateUniqueUsernameFromEmail(email: string) {
  const local = email.split('@')[0] ?? 'user';
  const base = slugifyUsername(local) || 'user';

  const existsBase = await User.findOne({ username: base }).select({ _id: 1 }).lean();
  if (!existsBase) return base;

  for (let i = 2; i <= 999; i++) {
    const candidate = `${base}_${i}`.slice(0, 24);
    // eslint-disable-next-line no-await-in-loop
    const exists = await User.findOne({ username: candidate }).select({ _id: 1 }).lean();
    if (!exists) return candidate;
  }

  return `user_${Date.now().toString(36)}`.slice(0, 24);
}

export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ success: true, user: null });
    }

    // Enrich session user with username for UX (no extra private fields).
    await connectDB();
    let dbUser = await User.findById(user.id).select({ username: 1, email: 1 }).lean();

    // Backfill legacy accounts (created before username was required)
    if (!dbUser?.username && dbUser?.email) {
      try {
        const username = await generateUniqueUsernameFromEmail(dbUser.email);
        await User.updateOne({ _id: user.id, username: { $exists: false } }, { $set: { username } });
        dbUser = { ...dbUser, username };
      } catch (e) {
        // Non-fatal: profile link may still not show if backfill fails.
        console.warn('Username backfill failed:', e);
      }
    }

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
