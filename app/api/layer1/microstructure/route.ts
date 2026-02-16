import { NextResponse } from 'next/server';

export const runtime = 'nodejs';

function sanitizeSymbol(v: string | null) {
  const s = String(v ?? '').trim().toUpperCase();
  if (!s) return null;
  if (!/^[A-Z0-9:_-]{2,20}$/.test(s)) return null;
  return s;
}

function sanitizeWindowSec(v: string | null, def: number) {
  const n = Number(v);
  if (!Number.isFinite(n)) return def;
  return Math.max(5, Math.min(60 * 10, Math.floor(n)));
}

function sanitizeDepth(v: string | null, def: number) {
  const n = Number(v);
  if (!Number.isFinite(n)) return def;
  return Math.max(5, Math.min(100, Math.floor(n)));
}

function safeNum(v: any) {
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
}

type Trade = {
  price: number;
  qty: number;
  time: number;
  isBuyerMaker: boolean;
};

function realizedVolFromTrades(trades: Trade[], windowMs: number) {
  // Simple realized volatility from log returns of trade prices.
  // Not annualized; meant as a micro meter.
  if (!trades.length) return { rv: null, n: 0 };
  const now = Date.now();
  const cutoff = now - windowMs;
  const inWin = trades.filter((t) => t.time >= cutoff).sort((a, b) => a.time - b.time);
  if (inWin.length < 3) return { rv: null, n: inWin.length };

  let sumSq = 0;
  let cnt = 0;
  for (let i = 1; i < inWin.length; i++) {
    const p0 = inWin[i - 1].price;
    const p1 = inWin[i].price;
    if (p0 > 0 && p1 > 0) {
      const r = Math.log(p1 / p0);
      sumSq += r * r;
      cnt++;
    }
  }
  if (!cnt) return { rv: null, n: inWin.length };
  return { rv: Math.sqrt(sumSq / cnt), n: inWin.length };
}

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const symbol = sanitizeSymbol(searchParams.get('symbol'));
    if (!symbol) return NextResponse.json({ success: false, error: 'Invalid symbol' }, { status: 400 });

    const winSec = sanitizeWindowSec(searchParams.get('window'), 60);
    const depthLimit = sanitizeDepth(searchParams.get('depth'), 50);
    const whaleThresholdUsdt = Number(searchParams.get('whale_usdt') ?? '250000');
    const whaleTh = Number.isFinite(whaleThresholdUsdt) ? Math.max(1000, whaleThresholdUsdt) : 250000;

    // Fetch trades (for tps, agg vol/s, CVD delta per tick, realized vol)
    const tradesUrl = new URL('https://fapi.binance.com/fapi/v1/trades');
    tradesUrl.searchParams.set('symbol', symbol);
    tradesUrl.searchParams.set('limit', '1000');

    // Fetch orderbook depth (for imbalance, walls, spread)
    const depthUrl = new URL('https://fapi.binance.com/fapi/v1/depth');
    depthUrl.searchParams.set('symbol', symbol);
    depthUrl.searchParams.set('limit', String(depthLimit));

    const [tradesRes, depthRes] = await Promise.all([
      fetch(tradesUrl.toString(), { cache: 'no-store' }),
      fetch(depthUrl.toString(), { cache: 'no-store' }),
    ]);

    const tradesRaw = await tradesRes.json().catch(() => null);
    const depthRaw = await depthRes.json().catch(() => null);

    if (!tradesRes.ok) {
      return NextResponse.json(
        { success: false, error: `Binance trades error (${tradesRes.status})`, details: tradesRaw },
        { status: 502 }
      );
    }
    if (!depthRes.ok) {
      return NextResponse.json(
        { success: false, error: `Binance depth error (${depthRes.status})`, details: depthRaw },
        { status: 502 }
      );
    }

    const now = Date.now();
    const cutoff = now - winSec * 1000;

    const trades: Trade[] = Array.isArray(tradesRaw)
      ? tradesRaw
          .map((t: any) => ({
            price: Number(t?.price),
            qty: Number(t?.qty),
            time: Number(t?.time),
            isBuyerMaker: Boolean(t?.isBuyerMaker),
          }))
          .filter((t: Trade) => Number.isFinite(t.price) && Number.isFinite(t.qty) && Number.isFinite(t.time))
      : [];

    const tradesInWin = trades.filter((t) => t.time >= cutoff);

    // Trade flow speed
    const tps = tradesInWin.length / Math.max(1, winSec);
    let takerBuyQty = 0;
    let takerSellQty = 0;
    let takerBuyCount = 0;
    let takerSellCount = 0;

    for (const t of tradesInWin) {
      if (t.isBuyerMaker) {
        // seller was taker
        takerSellQty += t.qty;
        takerSellCount++;
      } else {
        // buyer was taker
        takerBuyQty += t.qty;
        takerBuyCount++;
      }
    }

    const aggVolPerSec = (takerBuyQty + takerSellQty) / Math.max(1, winSec);

    // CVD delta for this window (client can accumulate running CVD)
    const cvdDelta = takerBuyQty - takerSellQty;

    // Realized vol 1m
    const { rv: rv1m, n: rvN } = realizedVolFromTrades(trades, 60 * 1000);

    // Orderbook parsing
    const bids: [number, number][] = Array.isArray(depthRaw?.bids)
      ? depthRaw.bids
          .map((r: any) => [Number(r?.[0]), Number(r?.[1])] as [number, number])
          .filter((r: any) => Number.isFinite(r[0]) && Number.isFinite(r[1]))
      : [];
    const asks: [number, number][] = Array.isArray(depthRaw?.asks)
      ? depthRaw.asks
          .map((r: any) => [Number(r?.[0]), Number(r?.[1])] as [number, number])
          .filter((r: any) => Number.isFinite(r[0]) && Number.isFinite(r[1]))
      : [];

    const bestBid = bids.length ? bids[0][0] : null;
    const bestAsk = asks.length ? asks[0][0] : null;
    const spread = bestBid != null && bestAsk != null ? bestAsk - bestBid : null;
    const mid = bestBid != null && bestAsk != null ? (bestBid + bestAsk) / 2 : null;

    // Imbalance top 5 levels
    const topN = 5;
    const bidTop = bids.slice(0, topN);
    const askTop = asks.slice(0, topN);
    const bidSumQty = bidTop.reduce((acc, r) => acc + (Number.isFinite(r[1]) ? r[1] : 0), 0);
    const askSumQty = askTop.reduce((acc, r) => acc + (Number.isFinite(r[1]) ? r[1] : 0), 0);

    const imbalanceRatio = askSumQty > 0 ? bidSumQty / askSumQty : bidSumQty > 0 ? Infinity : null;
    const imbalanceSide = imbalanceRatio == null ? null : imbalanceRatio >= 1 ? 'BID' : 'ASK';
    const imbalanceAbs = imbalanceRatio == null ? null : imbalanceRatio >= 1 ? imbalanceRatio : 1 / (imbalanceRatio || 1);
    const imbalanceFlag = imbalanceAbs != null && imbalanceAbs >= 3;

    // Heatmap values per level (ratio at each level)
    const heatmap = Array.from({ length: topN }).map((_, i) => {
      const bq = safeNum(bidTop[i]?.[1]) ?? 0;
      const aq = safeNum(askTop[i]?.[1]) ?? 0;
      const r = aq > 0 ? bq / aq : bq > 0 ? Infinity : null;
      return { level: i + 1, bidQty: bq, askQty: aq, ratio: r };
    });

    // Whale wall detector (simple): single level notional > X USDT in top 20 levels
    const wallLevels = 20;
    const bidWalls = bids.slice(0, wallLevels)
      .map(([p, q]) => ({ side: 'BID' as const, price: p, qty: q, notional: p * q }))
      .filter((x) => Number.isFinite(x.notional) && x.notional >= whaleTh)
      .sort((a, b) => b.notional - a.notional);
    const askWalls = asks.slice(0, wallLevels)
      .map(([p, q]) => ({ side: 'ASK' as const, price: p, qty: q, notional: p * q }))
      .filter((x) => Number.isFinite(x.notional) && x.notional >= whaleTh)
      .sort((a, b) => b.notional - a.notional);

    const topWall = [...askWalls, ...bidWalls].sort((a, b) => b.notional - a.notional)[0] ?? null;

    // Absorption heuristic (very rough, Vercel-safe):
    // - If taker buy dominates but spread/mid doesn't move much, and there is still big ask liquidity in top5 => buy absorption.
    // - If taker sell dominates but there is still big bid liquidity in top5 => sell absorption.
    const flowImbalance = (takerBuyQty + takerSellQty) > 0 ? (takerBuyQty - takerSellQty) / (takerBuyQty + takerSellQty) : 0;
    const buyAbsorption = flowImbalance > 0.25 && askSumQty > bidSumQty; // buy flow but asks still heavier
    const sellAbsorption = flowImbalance < -0.25 && bidSumQty > askSumQty; // sell flow but bids still heavier

    // Micro meter labels
    const microVolLabel = rv1m == null ? '—' : rv1m > 0.003 ? 'HIGH' : rv1m > 0.0015 ? 'MED' : 'LOW';
    const spreadLabel = spread == null || mid == null ? '—' : (spread / mid) > 0.0008 ? 'WIDE' : (spread / mid) > 0.0003 ? 'NORMAL' : 'TIGHT';
    const obVelocityLabel = imbalanceAbs != null && imbalanceAbs > 2.5 ? 'FAST' : imbalanceAbs != null && imbalanceAbs > 1.5 ? 'NORMAL' : 'SLOW';

    const data = {
      symbol,
      exchange: 'binance-futures',
      window_sec: winSec,
      ts: new Date().toISOString(),

      cvd: {
        delta_base_qty: cvdDelta,
        taker_buy_base_qty: takerBuyQty,
        taker_sell_base_qty: takerSellQty,
        taker_buy_count: takerBuyCount,
        taker_sell_count: takerSellCount,
      },

      trade_flow_speed: {
        trades_per_sec: tps,
        aggr_base_qty_per_sec: aggVolPerSec,
      },

      micro_volatility: {
        realized_vol_1m: rv1m,
        realized_vol_n: rvN,
        spread,
        mid,
      },

      imbalance: {
        top_levels: topN,
        bid_sum_qty: bidSumQty,
        ask_sum_qty: askSumQty,
        ratio: imbalanceRatio,
        side: imbalanceSide,
        abs_ratio: imbalanceAbs,
        flag_gt_3_to_1: imbalanceFlag,
        heatmap,
      },

      whale: {
        threshold_usdt: whaleTh,
        top_wall: topWall,
        bid_walls: bidWalls.slice(0, 3),
        ask_walls: askWalls.slice(0, 3),
      },

      alerts: {
        buy_absorption_detected: buyAbsorption,
        sell_absorption_detected: sellAbsorption,
      },

      meters: {
        micro_vol: microVolLabel,
        spread: spreadLabel,
        ob_velocity: obVelocityLabel,
      },
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
      { success: false, error: 'Failed to fetch Layer 1 microstructure', details: err?.message },
      { status: 500 }
    );
  }
}
