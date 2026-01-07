import crypto from 'crypto';
import { NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import User from '@/models/User';
import PasswordResetToken from '@/models/PasswordResetToken';
import { isEmailConfigured, sendEmail } from '@/lib/email/mailer';

function sha256Hex(input: string) {
  return crypto.createHash('sha256').update(input).digest('hex');
}

function randomToken() {
  return crypto.randomBytes(32).toString('hex');
}

export async function POST(req: Request) {
  await connectDB();

  const body = (await req.json().catch(() => null)) as { email?: string } | null;
  const email = (body?.email ?? '').toString().trim().toLowerCase();

  // Always respond success to prevent user enumeration.
  if (!email || !email.includes('@')) {
    return NextResponse.json({ success: true });
  }

  const user = await User.findOne({ email }).select({ _id: 1, email: 1 }).lean();
  if (!user) {
    return NextResponse.json({ success: true });
  }

  const token = randomToken();
  const tokenHash = sha256Hex(token);
  const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

  await PasswordResetToken.create({ userId: user._id, tokenHash, expiresAt });

  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || '';
  const resetPath = `/reset-password?token=${encodeURIComponent(token)}&email=${encodeURIComponent(email)}`;
  const resetUrl = baseUrl ? `${baseUrl}${resetPath}` : resetPath;

  // Send email if SMTP is configured; otherwise log the URL (useful for dev).
  if (isEmailConfigured()) {
    try {
      await sendEmail({
        to: email,
        subject: 'Reset password - Quantum Terminal',
        text: `Klik link berikut untuk reset password (berlaku 1 jam):\n\n${resetUrl}\n\nJika kamu tidak meminta reset, abaikan email ini.`,
        html: `
          <div style="font-family:Arial,sans-serif;line-height:1.5">
            <h2 style="margin:0 0 12px">Reset password</h2>
            <p style="margin:0 0 12px">Klik tombol di bawah untuk reset password (berlaku 1 jam).</p>
            <p style="margin:0 0 16px">
              <a href="${resetUrl}" style="display:inline-block;padding:10px 14px;background:#22d3ee;color:#041015;text-decoration:none;border-radius:8px;font-weight:600">
                Reset password
              </a>
            </p>
            <p style="margin:0 0 8px">Atau copy link ini:</p>
            <p style="margin:0"><a href="${resetUrl}">${resetUrl}</a></p>
            <hr style="margin:18px 0;border:none;border-top:1px solid #e5e7eb" />
            <p style="margin:0;color:#6b7280">Jika kamu tidak meminta reset, abaikan email ini.</p>
          </div>
        `.trim(),
      });
    } catch (err) {
      console.error('[password-reset] email send failed:', err);
      console.log(`[password-reset] email=${email} url=${resetUrl}`);
    }
  } else {
    console.log(`[password-reset] email=${email} url=${resetUrl}`);
  }

  return NextResponse.json({ success: true });
}
