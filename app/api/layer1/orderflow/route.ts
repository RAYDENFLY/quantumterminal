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

    const win = windowSec ?? 60;
    const now = Date.now();
    const cutoff = now - win * 1000;

    const u = new URL('https://fapi.binance.com/fapi/v1/trades');
    u.searchParams.set('symbol', symbol);
    // Max is 1000. For high-liquidity symbols, 1000 trades may cover < 60s.
    u.searchParams.set('limit', '1000');

    const upstream = await fetch(u.toString(), { cache: 'no-store' });
    const raw = await upstream.json().catch(() => null);

    if (!upstream.ok) {
      return NextResponse.json(
        { success: false, error: `Binance error (${upstream.status})`, details: raw },
        { status: 502 }
      );
    }

    const trades: any[] = Array.isArray(raw) ? raw : [];
    let buyVol = 0;
    let sellVol = 0;
    let buyCount = 0;
    let sellCount = 0;

    // Binance futures trades: { qty: string, time: number, isBuyerMaker: boolean }
    for (const t of trades) {
      const time = Number(t?.time);
      if (!Number.isFinite(time) || time < cutoff) continue;
      const qty = Number(t?.qty);
      if (!Number.isFinite(qty)) continue;

      const isBuyerMaker = Boolean(t?.isBuyerMaker);
      if (isBuyerMaker) {
        // Seller was taker => aggressive sell
        sellVol += qty;
        sellCount += 1;
      } else {
        // Buyer was taker => aggressive buy
        buyVol += qty;
        buyCount += 1;
      }
    }

    const delta = buyVol - sellVol;
    const ratio = sellVol > 0 ? buyVol / sellVol : null;

    const data = {
      symbol,
      exchange: 'binance-futures',
      window_sec: win,
      aggr_buys: { volume: buyVol, count: buyCount, unit: 'base_qty' },
      aggr_sells: { volume: sellVol, count: sellCount, unit: 'base_qty' },
      delta,
      ratio,
      ts: new Date().toISOString(),
      notes: trades.length === 1000 ? 'Trade sample limited to 1000 most recent trades. For very active markets, window coverage may be partial.' : undefined,
    };

    return NextResponse.json(
      { success: true, data },
      {
        headers: {
          'Cache-Control': 'public, s-maxage=1, stale-while-revalidate=4',
        },
      }
    );
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: 'Failed to fetch Layer 1 orderflow', details: err?.message },
      { status: 500 }
    );
  }
}
