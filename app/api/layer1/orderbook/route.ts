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

function sanitizeDepth(v: string | null) {
  const n = Number(v);
  if (!Number.isFinite(n)) return null;
  const allowed = new Set([10, 25, 50, 100]);
  const nn = Math.floor(n);
  if (!allowed.has(nn)) return 50;
  return nn;
}

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const symbol = sanitizeSymbol(searchParams.get('symbol'));
    const depth = sanitizeDepth(searchParams.get('depth'));

    if (!symbol) {
      return NextResponse.json({ success: false, error: 'Invalid symbol' }, { status: 400 });
    }

    // Binance USDT-M Futures
    const u = new URL('https://fapi.binance.com/fapi/v1/depth');
    u.searchParams.set('symbol', symbol);
    u.searchParams.set('limit', String(depth ?? 50));

    const upstream = await fetch(u.toString(), {
      cache: 'no-store',
      headers: {
        // Light caching at the edge is okay since UI refreshes every few seconds.
        // (Server-side no-store still, but we can return cache headers below.)
      },
    });

    const raw = await upstream.json().catch(() => null);
    if (!upstream.ok) {
      return NextResponse.json(
        { success: false, error: `Binance error (${upstream.status})`, details: raw },
        { status: 502 }
      );
    }

    const bids: [number, number][] = Array.isArray(raw?.bids)
      ? raw.bids.map((r: any) => [Number(r?.[0]), Number(r?.[1])]).filter((r: any) => Number.isFinite(r[0]) && Number.isFinite(r[1]))
      : [];
    const asks: [number, number][] = Array.isArray(raw?.asks)
      ? raw.asks.map((r: any) => [Number(r?.[0]), Number(r?.[1])]).filter((r: any) => Number.isFinite(r[0]) && Number.isFinite(r[1]))
      : [];

    const bestBid = bids.length ? bids[0][0] : null;
    const bestAsk = asks.length ? asks[0][0] : null;
    const mid = bestBid != null && bestAsk != null ? (bestBid + bestAsk) / 2 : null;
    const spread = bestBid != null && bestAsk != null ? bestAsk - bestBid : null;

    const data = {
      symbol,
      exchange: 'binance-futures',
      depth: depth ?? 50,
      bids,
      asks,
      mid,
      spread,
      ts: new Date().toISOString(),
    };

    return NextResponse.json(
      { success: true, data },
      {
        headers: {
          // Allow short caching to reduce pressure; UI is polling anyway.
          'Cache-Control': 'public, s-maxage=1, stale-while-revalidate=4',
        },
      }
    );
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: 'Failed to fetch Layer 1 orderbook', details: err?.message },
      { status: 500 }
    );
  }
}
