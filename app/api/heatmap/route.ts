import { NextResponse } from 'next/server';

export const runtime = 'nodejs';

function sanitizeSymbol(v: string | null) {
  const s = String(v ?? '').trim().toUpperCase();
  if (!s) return null;
  if (!/^[A-Z0-9:_-]{2,20}$/.test(s)) return null;
  return s;
}

function getFuturesBase() {
  return (process.env.LAYER1_BINANCE_FAPI_BASE_URL || 'https://fapi.binance.com').replace(/\/$/, '');
}

// Attempt a fetch; returns { res, raw, ok } — never throws.
async function safeFetch(url: string) {
  try {
    const res = await fetch(url, { cache: 'no-store' });
    const raw = await res.json().catch(() => null);
    return { res, raw, ok: res.ok };
  } catch (e: any) {
    return { res: null, raw: null, ok: false, err: e?.message };
  }
}

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const symbol = sanitizeSymbol(searchParams.get('symbol'));
    if (!symbol) return NextResponse.json({ success: false, error: 'Invalid symbol' }, { status: 400 });

    const futuresBase = getFuturesBase();

    // ── Depth: try Futures (500 levels) → fallback Spot (200 levels) ──────────
    const FUTURES_DEPTH = 500;
    const SPOT_FALLBACK_DEPTH = 200;

    let depthRaw: any = null;
    let depthSource = 'futures';

    const futuresDepth = await safeFetch(
      `${futuresBase}/fapi/v1/depth?symbol=${symbol}&limit=${FUTURES_DEPTH}`
    );

    if (futuresDepth.ok) {
      depthRaw = futuresDepth.raw;
    } else {
      // Fallback: Binance Spot REST (works even when fapi is 451-blocked)
      const spotDepth = await safeFetch(
        `https://api.binance.com/api/v3/depth?symbol=${symbol}&limit=${SPOT_FALLBACK_DEPTH}`
      );
      if (spotDepth.ok) {
        depthRaw = spotDepth.raw;
        depthSource = 'spot-fallback';
      } else {
        return NextResponse.json(
          {
            success: false,
            error: `Binance depth unavailable — futures (${futuresDepth.res?.status ?? 'ERR'}) and spot fallback (${spotDepth.res?.status ?? 'ERR'}) both failed`,
            hint: 'HTTP 451 means the server region is blocked by Binance. Set LAYER1_BINANCE_FAPI_BASE_URL to a compliant proxy.',
            futuresDetails: futuresDepth.raw,
            spotDetails: spotDepth.raw,
          },
          { status: 502 }
        );
      }
    }

    // ── Trades: try Futures → fallback Spot ───────────────────────────────────
    let tradesRaw: any = null;

    const futuresTrades = await safeFetch(
      `${futuresBase}/fapi/v1/trades?symbol=${symbol}&limit=1000`
    );
    if (futuresTrades.ok) {
      tradesRaw = futuresTrades.raw;
    } else {
      const spotTrades = await safeFetch(
        `https://api.binance.com/api/v3/trades?symbol=${symbol}&limit=1000`
      );
      if (spotTrades.ok) tradesRaw = spotTrades.raw;
      // trades failure is non-fatal — pressure metrics will just be null
    }

    // Parse orderbook
    const bids: [number, number][] = Array.isArray(depthRaw?.bids)
      ? depthRaw.bids
          .map((r: any) => [Number(r[0]), Number(r[1])] as [number, number])
          .filter((r: [number, number]) => r[1] > 0)
      : [];
    const asks: [number, number][] = Array.isArray(depthRaw?.asks)
      ? depthRaw.asks
          .map((r: any) => [Number(r[0]), Number(r[1])] as [number, number])
          .filter((r: [number, number]) => r[1] > 0)
      : [];

    const bestBid = bids[0]?.[0] ?? null;
    const bestAsk = asks[0]?.[0] ?? null;
    const mid = bestBid && bestAsk ? (bestBid + bestAsk) / 2 : null;
    const spread = bestBid && bestAsk ? bestAsk - bestBid : null;

    // Compute notional per level (price * qty)
    const bidLevels = bids.slice(0, 200).map(([price, qty]) => ({
      price,
      qty,
      notional: price * qty,
      side: 'bid' as const,
    }));
    const askLevels = asks.slice(0, 200).map(([price, qty]) => ({
      price,
      qty,
      notional: price * qty,
      side: 'ask' as const,
    }));

    // Liquidity walls: levels where notional > 2× average of top-20
    function detectWalls(levels: { price: number; qty: number; notional: number; side: 'bid' | 'ask' }[], topN = 20) {
      if (!levels.length) return [];
      const top = levels.slice(0, topN);
      const avgNotional = top.reduce((s, l) => s + l.notional, 0) / top.length;
      const threshold = avgNotional * 2.5;
      return levels.filter((l) => l.notional >= threshold).slice(0, 10);
    }

    const bidWalls = detectWalls(bidLevels);
    const askWalls = detectWalls(askLevels);

    // Cumulative depth (for buy/sell pressure curve)
    let cumBid = 0;
    const bidDepth = bidLevels.slice(0, 100).map((l) => {
      cumBid += l.qty;
      return { price: l.price, qty: l.qty, notional: l.notional, cumQty: cumBid };
    });

    let cumAsk = 0;
    const askDepth = askLevels.slice(0, 100).map((l) => {
      cumAsk += l.qty;
      return { price: l.price, qty: l.qty, notional: l.notional, cumQty: cumAsk };
    });

    // Total bid vs ask qty in top-50 levels (pressure score)
    const bidQty50 = bidLevels.slice(0, 50).reduce((s, l) => s + l.qty, 0);
    const askQty50 = askLevels.slice(0, 50).reduce((s, l) => s + l.qty, 0);
    const bidNotional50 = bidLevels.slice(0, 50).reduce((s, l) => s + l.notional, 0);
    const askNotional50 = askLevels.slice(0, 50).reduce((s, l) => s + l.notional, 0);
    const pressureRatio = askQty50 > 0 ? bidQty50 / askQty50 : null;
    const pressureSide = pressureRatio == null ? null : pressureRatio > 1.15 ? 'BUY' : pressureRatio < 0.87 ? 'SELL' : 'NEUTRAL';

    // Max notional for color intensity normalization
    const allLevels = [...bidLevels, ...askLevels];
    const maxNotional = allLevels.reduce((m, l) => Math.max(m, l.notional), 0);

    // Recent trade flow (taker buy vs sell in last 500 trades for pressure confirmation)
    let takerBuyQty = 0;
    let takerSellQty = 0;
    if (Array.isArray(tradesRaw)) {
      for (const t of tradesRaw.slice(-500)) {
        const qty = Number(t.qty);
        if (t.isBuyerMaker) {
          takerSellQty += qty; // seller was taker
        } else {
          takerBuyQty += qty; // buyer was taker
        }
      }
    }
    const totalTradeQty = takerBuyQty + takerSellQty;
    const takerBuyPct = totalTradeQty > 0 ? takerBuyQty / totalTradeQty : null;

    return NextResponse.json(
      {
        success: true,
        data: {
          symbol,
          exchange: depthSource === 'spot-fallback' ? 'binance-spot' : 'binance-futures',
          depthSource,
          ts: new Date().toISOString(),
          mid,
          spread,
          bestBid,
          bestAsk,
          maxNotional,
          bidDepth,
          askDepth,
          bidWalls,
          askWalls,
          pressure: {
            bidQty50,
            askQty50,
            bidNotional50,
            askNotional50,
            pressureRatio,
            pressureSide,
            takerBuyQty,
            takerSellQty,
            takerBuyPct,
          },
        },
      },
      {
        headers: { 'Cache-Control': 'public, s-maxage=1, stale-while-revalidate=3' },
      }
    );
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: 'Failed to fetch heatmap data', details: err?.message },
      { status: 500 }
    );
  }
}
