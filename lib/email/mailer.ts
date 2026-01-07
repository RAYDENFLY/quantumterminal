import nodemailer from 'nodemailer';

export type SendEmailArgs = {
  to: string;
  subject: string;
  text: string;
  html?: string;
};

function getSmtpConfig() {
  const host = process.env.SMTP_HOST;
  const portRaw = process.env.SMTP_PORT;
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;
  const from = process.env.MAIL_FROM;

  if (!host || !portRaw || !user || !pass || !from) return null;

  const port = Number(portRaw);
  if (!Number.isFinite(port) || port <= 0) return null;

  // Brevo SMTP ports: 587 (STARTTLS) or 465 (TLS)
  const secure = port === 465;

  return { host, port, secure, auth: { user, pass }, from };
}

export function isEmailConfigured() {
  return Boolean(getSmtpConfig());
}

export async function sendEmail({ to, subject, text, html }: SendEmailArgs) {
  const cfg = getSmtpConfig();
  if (!cfg) {
    throw new Error('Email not configured (missing SMTP_HOST/SMTP_PORT/SMTP_USER/SMTP_PASS/MAIL_FROM)');
  }

  const transporter = nodemailer.createTransport({
    host: cfg.host,
    port: cfg.port,
    secure: cfg.secure,
    auth: cfg.auth,
  });

  await transporter.sendMail({
    from: cfg.from,
    to,
    subject,
    text,
    ...(html ? { html } : null),
  });
}
