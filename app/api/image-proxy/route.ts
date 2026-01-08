import { NextResponse } from 'next/server';

export const runtime = 'nodejs';

const ALLOWED_HOSTS = new Set([
  'i.ibb.co',
  'ibb.co',
  'image.ibb.co',
]);

function isAllowedUrl(raw: string): { ok: true; url: URL } | { ok: false; reason: string } {
  let url: URL;
  try {
    url = new URL(raw);
  } catch {
    return { ok: false, reason: 'Invalid url' };
  }

  if (url.protocol !== 'https:') return { ok: false, reason: 'Only https is allowed' };

  // Prevent SSRF to private networks by requiring strict allowlist.
  if (!ALLOWED_HOSTS.has(url.hostname)) return { ok: false, reason: 'Host not allowed' };

  return { ok: true, url };
}

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const rawUrl = searchParams.get('url') || '';

  const parsed = isAllowedUrl(rawUrl);
  if (!parsed.ok) {
    return NextResponse.json({ success: false, error: parsed.reason }, { status: 400 });
  }

  const controller = new AbortController();
  // Keep this relatively low: when ISP blocks/mitm's ImgBB, it will otherwise stall the page.
  const timeoutMs = 4_000;
  const t = setTimeout(() => controller.abort(), timeoutMs);

  let upstream: Response;
  try {
    upstream = await fetch(parsed.url.toString(), {
      signal: controller.signal,
      // Help Next/Node cache the response when possible.
      // Note: cache behavior can vary between dev/prod.
      cache: 'force-cache',
      // Don’t forward cookies/headers.
      headers: {
        'User-Agent': 'QuantumTerminal Image Proxy',
        Accept: 'image/*,*/*;q=0.8',
      },
    });
  } catch (err: any) {
    const code = err?.cause?.code || err?.code;
    const message = err?.cause?.message || err?.message || 'Upstream fetch failed';
    return NextResponse.json(
      {
        success: false,
        error: 'Image proxy fetch failed',
        code,
        details: message,
        hint:
          code === 'ERR_TLS_CERT_ALTNAME_INVALID'
            ? 'Your network/ISP appears to intercept HTTPS (MITM). A server-side proxy cannot safely bypass this. Use a different image host on your own domain (S3/R2/Cloudinary/Vercel Blob) or change network/DNS/VPN.'
            : undefined,
      },
      { status: 502 }
    );
  } finally {
    clearTimeout(t);
  }

  if (!upstream.ok) {
    return NextResponse.json(
      { success: false, error: `Upstream fetch failed (${upstream.status})` },
      { status: 502 }
    );
  }

  const contentType = upstream.headers.get('content-type') || 'application/octet-stream';
  if (!contentType.toLowerCase().startsWith('image/')) {
    return NextResponse.json({ success: false, error: 'Upstream is not an image' }, { status: 415 });
  }

  const body = upstream.body;
  if (!body) {
    return NextResponse.json({ success: false, error: 'Empty upstream response' }, { status: 502 });
  }

  const res = new NextResponse(body, {
    status: 200,
    headers: {
      'Content-Type': contentType,
      // Cache for 1 day at the edge/browser (tweak as needed).
      'Cache-Control': 'public, max-age=86400, s-maxage=86400, stale-while-revalidate=604800',
    },
  });

  return res;
}
