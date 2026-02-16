import { NextResponse } from 'next/server';

export const runtime = 'nodejs';

function sanitizeSymbol(v: string | null) {
  const s = String(v ?? '').trim().toUpperCase();
  if (!s) return null;
  if (!/^[A-Z0-9:_-]{2,20}$/.test(s)) return null;
  return s;
}

function sanitizeExchange(v: string | null) {
  const s = String(v ?? '').trim().toLowerCase();
  if (!s) return null;
  if (!/^[a-z0-9_-]{2,20}$/.test(s)) return null;
  return s;
}

function sanitizeWindowSec(v: string | null) {
  const n = Number(v);
  if (!Number.isFinite(n)) return null;
  const nn = Math.max(1, Math.min(60 * 60, Math.floor(n)));
  return nn;
}

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const symbol = sanitizeSymbol(searchParams.get('symbol'));
    const windowSec = sanitizeWindowSec(searchParams.get('window'));

    if (!symbol) {
      return NextResponse.json({ success: false, error: 'Invalid symbol' }, { status: 400 });
    }

    // Placeholder: these need agreed definitions + data source.
    // Keep response shape stable for the UI.
    return NextResponse.json(
      {
        success: false,
        error: 'Not connected',
        details: {
          symbol,
          exchange: 'binance-futures',
          window_sec: windowSec ?? 60,
          message: 'VP/OP/POT/LP metrics are not implemented yet. Provide definitions + data source to enable.',
        },
      },
      { status: 501 }
    );
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: 'Failed to fetch Layer 1 metrics', details: err?.message },
      { status: 500 }
    );
  }
}
