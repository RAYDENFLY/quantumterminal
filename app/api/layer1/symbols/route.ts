import { NextResponse } from 'next/server';

export const runtime = 'nodejs';

function sanitizeQuery(v: string | null) {
  const s = String(v ?? '').trim().toUpperCase();
  if (!s) return '';
  // Keep it strict-ish; symbols are uppercase letters/numbers and optional separators.
  if (!/^[A-Z0-9:_-]{0,30}$/.test(s)) return '';
  return s;
}

type BinanceExchangeInfo = {
  symbols?: Array<{
    symbol?: string;
    contractType?: string;
    status?: string;
    quoteAsset?: string;
    marginAsset?: string;
    underlyingType?: string;
    pair?: string;
  }>;
};

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const q = sanitizeQuery(searchParams.get('q'));

    const upstream = await fetch('https://fapi.binance.com/fapi/v1/exchangeInfo', {
      cache: 'no-store',
    });

    const raw = (await upstream.json().catch(() => null)) as BinanceExchangeInfo | null;
    if (!upstream.ok) {
      return NextResponse.json(
        { success: false, error: `Binance error (${upstream.status})`, details: raw },
        { status: 502 }
      );
    }

    const all = Array.isArray(raw?.symbols) ? raw!.symbols! : [];

    // Default to tradable USDT perpetuals.
    const filtered = all
      .filter((s) => s?.status === 'TRADING')
      .filter((s) => (s?.contractType ?? '').toUpperCase() === 'PERPETUAL')
      .filter((s) => (s?.quoteAsset ?? '').toUpperCase() === 'USDT')
      .map((s) => String(s?.symbol ?? '').toUpperCase())
      .filter((sym) => /^[A-Z0-9:_-]{2,30}$/.test(sym));

    const uniq = Array.from(new Set(filtered)).sort();
    const out = q ? uniq.filter((sym) => sym.includes(q)) : uniq;

    // Avoid huge payloads. If user wants "semua pair", they can paginate later.
    // For now we cap to 2000 which should cover all USDT perpetuals easily.
    const cap = 2000;
    const capped = out.slice(0, cap);

    return NextResponse.json(
      {
        success: true,
        data: {
          exchange: 'binance-futures',
          count: capped.length,
          capped: out.length > cap,
          symbols: capped,
          ts: new Date().toISOString(),
        },
      },
      {
        headers: {
          'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=300',
        },
      }
    );
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: 'Failed to fetch Layer 1 symbols', details: err?.message },
      { status: 500 }
    );
  }
}
