'use client';

import { useCallback, useEffect, useRef, useState, useMemo } from 'react';
import useSWR from 'swr';

// ─── Types ────────────────────────────────────────────────────────────────────

type Level = {
  price: number;
  qty: number;
  notional: number;
  cumQty: number;
  side: 'bid' | 'ask';
};

type Wall = {
  price: number;
  qty: number;
  notional: number;
  side: 'bid' | 'ask';
};

type Pressure = {
  bidQty50: number;
  askQty50: number;
  bidNotional50: number;
  askNotional50: number;
  pressureRatio: number | null;
  pressureSide: 'BUY' | 'SELL' | 'NEUTRAL' | null;
  takerBuyQty: number;
  takerSellQty: number;
  takerBuyPct: number | null;
};

type HeatmapData = {
  symbol: string;
  ts: string;
  mid: number | null;
  spread: number | null;
  bestBid: number | null;
  bestAsk: number | null;
  maxNotional: number;
  bidDepth: Level[];
  askDepth: Level[];
  bidWalls: Wall[];
  askWalls: Wall[];
  pressure: Pressure;
  depthSource?: 'futures' | 'spot-fallback';
  exchange?: string;
};

type ApiRes = { success: boolean; data?: HeatmapData; error?: string };

// ─── Constants ────────────────────────────────────────────────────────────────

const COMMON_PAIRS = [
  'BTCUSDT', 'ETHUSDT', 'BNBUSDT', 'SOLUSDT', 'XRPUSDT',
  'ADAUSDT', 'DOGEUSDT', 'AVAXUSDT', 'LINKUSDT', 'NEARUSDT',
  'INJUSDT', 'SUIUSDT', 'OPUSDT', 'ARBUSDT', 'PEPEUSDT',
  'WIFUSDT', 'TIAUSDT', 'SEIUSDT', 'ATOMUSDT', 'LTCUSDT',
];

const ROW_H = 22; // px per price-level row
const MAX_ROWS = 40; // rows to show each side

const fetcher = (url: string) => fetch(url).then((r) => r.json());

// ─── Helpers ──────────────────────────────────────────────────────────────────

function fmtNum(v: number | null | undefined, d = 2) {
  if (v == null || !Number.isFinite(v)) return '—';
  return v.toLocaleString(undefined, { maximumFractionDigits: d, minimumFractionDigits: d });
}

function fmtK(v: number | null | undefined) {
  if (v == null || !Number.isFinite(v)) return '—';
  if (Math.abs(v) >= 1_000_000) return `${(v / 1_000_000).toFixed(2)}M`;
  if (Math.abs(v) >= 1_000) return `${(v / 1_000).toFixed(1)}K`;
  return v.toFixed(2);
}

function notionalToRgb(notional: number, max: number, side: 'bid' | 'ask', intensity = 1): string {
  if (!max) return 'transparent';
  const ratio = Math.min(1, notional / max) * intensity;
  const alpha = 0.08 + ratio * 0.72; // 0.08 – 0.80
  if (side === 'bid') return `rgba(16, 185, 129, ${alpha.toFixed(3)})`;   // emerald
  return `rgba(239, 68, 68, ${alpha.toFixed(3)})`;    // red
}

function wallBg(side: 'bid' | 'ask') {
  return side === 'bid'
    ? 'border-emerald-500/40 bg-emerald-500/10 text-emerald-300'
    : 'border-red-500/40 bg-red-500/10 text-red-300';
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function PressureBar({ ratio, side }: { ratio: number | null; side: 'BUY' | 'SELL' | 'NEUTRAL' | null }) {
  if (ratio == null) return <div className="h-2 bg-gray-700 rounded" />;

  // ratio = bidQty / askQty
  // 1.0 = balanced, >1 = bid heavy, <1 = ask heavy
  const pct = Math.min(100, Math.max(0, (ratio / (ratio + 1)) * 100));
  const label =
    side === 'BUY' ? 'BUY PRESSURE' : side === 'SELL' ? 'SELL PRESSURE' : 'BALANCED';
  const col =
    side === 'BUY' ? 'bg-emerald-500' : side === 'SELL' ? 'bg-red-500' : 'bg-yellow-500';

  return (
    <div>
      <div className="flex justify-between text-[11px] mb-1">
        <span className="text-gray-400">Bid qty</span>
        <span className={`font-semibold ${side === 'BUY' ? 'text-emerald-400' : side === 'SELL' ? 'text-red-400' : 'text-yellow-400'}`}>{label}</span>
        <span className="text-gray-400">Ask qty</span>
      </div>
      <div className="relative h-3 bg-gray-700 rounded overflow-hidden">
        <div
          className={`absolute left-0 top-0 h-full ${col} transition-all duration-500`}
          style={{ width: `${pct.toFixed(1)}%` }}
        />
        <div className="absolute inset-0 flex items-center justify-center text-[10px] font-bold text-white/80">
          {ratio.toFixed(2)}×
        </div>
      </div>
    </div>
  );
}

function TakerBar({ pct }: { pct: number | null }) {
  if (pct == null) return null;
  const buyPct = (pct * 100).toFixed(1);
  const sellPct = (100 - pct * 100).toFixed(1);
  return (
    <div>
      <div className="flex justify-between text-[11px] mb-1">
        <span className="text-emerald-400">Taker Buy {buyPct}%</span>
        <span className="text-red-400">Taker Sell {sellPct}%</span>
      </div>
      <div className="relative h-3 bg-red-500/40 rounded overflow-hidden">
        <div
          className="absolute left-0 top-0 h-full bg-emerald-500/80 transition-all duration-500"
          style={{ width: `${buyPct}%` }}
        />
      </div>
    </div>
  );
}

// ─── Depth Chart ─────────────────────────────────────────────────────────────

function DepthChart({
  bidDepth,
  askDepth,
  mid,
  bidWalls,
  askWalls,
}: {
  bidDepth: Level[];
  askDepth: Level[];
  mid: number | null;
  bidWalls: Wall[];
  askWalls: Wall[];
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const W = canvas.offsetWidth;
    const H = canvas.offsetHeight;
    canvas.width = W;
    canvas.height = H;

    ctx.clearRect(0, 0, W, H);

    if (!bidDepth.length && !askDepth.length) return;

    // ── Build cumulative arrays ──
    // Bids: sorted descending (highest price first → nearest mid on right)
    const bids = [...bidDepth].sort((a, b) => b.price - a.price);
    // Asks: sorted ascending (lowest price first → nearest mid on left)
    const asks = [...askDepth].sort((a, b) => a.price - b.price);

    // Compute cumulative notional
    let cumBid = 0;
    const bidPoints = bids.map((l) => { cumBid += l.notional; return { price: l.price, cum: cumBid }; });
    let cumAsk = 0;
    const askPoints = asks.map((l) => { cumAsk += l.notional; return { price: l.price, cum: cumAsk }; });

    const allPrices = [...bidPoints.map(p => p.price), ...askPoints.map(p => p.price)];
    const minPrice = Math.min(...allPrices);
    const maxPrice = Math.max(...allPrices);
    const maxCum = Math.max(bidPoints[bidPoints.length - 1]?.cum ?? 0, askPoints[askPoints.length - 1]?.cum ?? 0, 1);

    const PAD_L = 52, PAD_R = 12, PAD_T = 12, PAD_B = 32;
    const chartW = W - PAD_L - PAD_R;
    const chartH = H - PAD_T - PAD_B;

    const px = (price: number) => PAD_L + ((price - minPrice) / (maxPrice - minPrice || 1)) * chartW;
    const py = (cum: number)   => PAD_T + chartH - (cum / maxCum) * chartH;

    // ── Background grid ──
    ctx.strokeStyle = 'rgba(255,255,255,0.04)';
    ctx.lineWidth = 1;
    for (let i = 0; i <= 4; i++) {
      const y = PAD_T + (chartH / 4) * i;
      ctx.beginPath(); ctx.moveTo(PAD_L, y); ctx.lineTo(W - PAD_R, y); ctx.stroke();
    }
    for (let i = 0; i <= 4; i++) {
      const x = PAD_L + (chartW / 4) * i;
      ctx.beginPath(); ctx.moveTo(x, PAD_T); ctx.lineTo(x, PAD_T + chartH); ctx.stroke();
    }

    // ── Bid fill ──
    if (bidPoints.length > 1) {
      ctx.beginPath();
      ctx.moveTo(px(bidPoints[0].price), PAD_T + chartH);
      for (const p of bidPoints) ctx.lineTo(px(p.price), py(p.cum));
      ctx.lineTo(px(bidPoints[bidPoints.length - 1].price), PAD_T + chartH);
      ctx.closePath();
      const grad = ctx.createLinearGradient(0, PAD_T, 0, PAD_T + chartH);
      grad.addColorStop(0, 'rgba(16,185,129,0.35)');
      grad.addColorStop(1, 'rgba(16,185,129,0.04)');
      ctx.fillStyle = grad;
      ctx.fill();

      ctx.beginPath();
      ctx.moveTo(px(bidPoints[0].price), py(bidPoints[0].cum));
      for (const p of bidPoints) ctx.lineTo(px(p.price), py(p.cum));
      ctx.strokeStyle = 'rgba(16,185,129,0.85)';
      ctx.lineWidth = 1.5;
      ctx.stroke();
    }

    // ── Ask fill ──
    if (askPoints.length > 1) {
      ctx.beginPath();
      ctx.moveTo(px(askPoints[0].price), PAD_T + chartH);
      for (const p of askPoints) ctx.lineTo(px(p.price), py(p.cum));
      ctx.lineTo(px(askPoints[askPoints.length - 1].price), PAD_T + chartH);
      ctx.closePath();
      const grad = ctx.createLinearGradient(0, PAD_T, 0, PAD_T + chartH);
      grad.addColorStop(0, 'rgba(239,68,68,0.35)');
      grad.addColorStop(1, 'rgba(239,68,68,0.04)');
      ctx.fillStyle = grad;
      ctx.fill();

      ctx.beginPath();
      ctx.moveTo(px(askPoints[0].price), py(askPoints[0].cum));
      for (const p of askPoints) ctx.lineTo(px(p.price), py(p.cum));
      ctx.strokeStyle = 'rgba(239,68,68,0.85)';
      ctx.lineWidth = 1.5;
      ctx.stroke();
    }

    // ── Mid price line ──
    if (mid != null && mid >= minPrice && mid <= maxPrice) {
      const mx = px(mid);
      ctx.beginPath();
      ctx.moveTo(mx, PAD_T);
      ctx.lineTo(mx, PAD_T + chartH);
      ctx.strokeStyle = 'rgba(250,204,21,0.7)';
      ctx.lineWidth = 1;
      ctx.setLineDash([4, 4]);
      ctx.stroke();
      ctx.setLineDash([]);

      ctx.fillStyle = 'rgba(250,204,21,0.85)';
      ctx.font = '10px monospace';
      ctx.textAlign = 'center';
      ctx.fillText('Mid', mx, PAD_T - 2);
    }

    // ── Wall markers ──
    const bidWallPrices = new Set(bidWalls.map(w => w.price));
    const askWallPrices = new Set(askWalls.map(w => w.price));
    const drawWall = (price: number, color: string) => {
      if (price < minPrice || price > maxPrice) return;
      const wx = px(price);
      ctx.beginPath();
      ctx.moveTo(wx, PAD_T);
      ctx.lineTo(wx, PAD_T + chartH);
      ctx.strokeStyle = color;
      ctx.lineWidth = 1;
      ctx.setLineDash([2, 3]);
      ctx.stroke();
      ctx.setLineDash([]);
    };
    bidWallPrices.forEach(p => drawWall(p, 'rgba(16,185,129,0.5)'));
    askWallPrices.forEach(p => drawWall(p, 'rgba(239,68,68,0.5)'));

    // ── Y-axis labels ──
    ctx.fillStyle = 'rgba(156,163,175,0.8)';
    ctx.font = '10px monospace';
    ctx.textAlign = 'right';
    for (let i = 0; i <= 4; i++) {
      const val = (maxCum / 4) * (4 - i);
      const y = PAD_T + (chartH / 4) * i;
      const label = val >= 1_000_000 ? `${(val / 1_000_000).toFixed(1)}M` :
                    val >= 1_000     ? `${(val / 1_000).toFixed(0)}K`     : val.toFixed(0);
      ctx.fillText(`$${label}`, PAD_L - 4, y + 3);
    }

    // ── X-axis labels ──
    ctx.textAlign = 'center';
    for (let i = 0; i <= 4; i++) {
      const price = minPrice + ((maxPrice - minPrice) / 4) * i;
      const x = PAD_L + (chartW / 4) * i;
      const label = price >= 1000 ? price.toFixed(0) : price.toFixed(4);
      ctx.fillText(label, x, PAD_T + chartH + 18);
    }

  }, [bidDepth, askDepth, mid, bidWalls, askWalls]);

  return (
    <div className="px-2 pb-3 pt-1">
      <div className="flex items-center justify-between mb-1.5 px-2">
        <div className="text-[11px] font-semibold text-terminal-accent">Cumulative Depth Chart</div>
        <div className="flex items-center gap-3 text-[10px]">
          <span className="flex items-center gap-1">
            <span className="inline-block w-3 h-1.5 rounded-sm bg-emerald-500/70" />
            <span className="text-gray-400">Bids</span>
          </span>
          <span className="flex items-center gap-1">
            <span className="inline-block w-3 h-1.5 rounded-sm bg-red-500/70" />
            <span className="text-gray-400">Asks</span>
          </span>
          <span className="flex items-center gap-1">
            <span className="inline-block w-3 h-px bg-yellow-400/70" style={{ borderTop: '2px dashed rgba(250,204,21,0.7)' }} />
            <span className="text-gray-400">Mid</span>
          </span>
        </div>
      </div>
      <canvas
        ref={canvasRef}
        className="w-full rounded"
        style={{ height: 180, display: 'block' }}
      />
    </div>
  );
}

// ─── Heatmap rows ─────────────────────────────────────────────────────────────

function HeatmapRows({
  bidDepth,
  askDepth,
  maxNotional,
  mid,
  bidWalls,
  askWalls,
  layoutMode = 'top-bottom',
}: {
  bidDepth: Level[];
  askDepth: Level[];
  maxNotional: number;
  mid: number | null;
  bidWalls: Wall[];
  askWalls: Wall[];
  layoutMode?: 'top-bottom' | 'left-right';
}) {
  const bidWallPrices = new Set(bidWalls.map((w) => w.price));
  const askWallPrices = new Set(askWalls.map((w) => w.price));

  // asks show top-first (closest to mid at bottom), bids show closest to mid at top
  const asks = askDepth.slice(0, MAX_ROWS).reverse(); // reverse so lowest ask is closest to mid
  const bids = bidDepth.slice(0, MAX_ROWS);

  const maxCumQty = Math.max(
    bidDepth[MAX_ROWS - 1]?.cumQty ?? 0,
    askDepth[MAX_ROWS - 1]?.cumQty ?? 0,
    1
  );

  function Row({
    level,
    side,
  }: {
    level: Level;
    side: 'bid' | 'ask';
  }) {
    const isWall = side === 'bid' ? bidWallPrices.has(level.price) : askWallPrices.has(level.price);
    const bg = notionalToRgb(level.notional, maxNotional, side, isWall ? 1.4 : 1.0);
    const barW = Math.min(100, (level.cumQty / maxCumQty) * 100);
    const priceCol = side === 'bid' ? 'text-emerald-300' : 'text-red-300';

    return (
      <div
        className="relative flex items-center px-2 border-b border-white/[0.03] group"
        style={{ height: ROW_H, background: bg }}
      >
        {/* depth bar */}
        <div
          className={`absolute left-0 top-0 h-full opacity-10 ${side === 'bid' ? 'bg-emerald-400' : 'bg-red-400'}`}
          style={{ width: `${barW.toFixed(1)}%` }}
        />

        {/* wall badge */}
        {isWall && (
          <span className={`mr-1 text-[9px] font-bold rounded px-1 py-0 ${side === 'bid' ? 'bg-emerald-500/30 text-emerald-300' : 'bg-red-500/30 text-red-300'}`}>
            WALL
          </span>
        )}

        <span className={`relative flex-1 text-[12px] font-mono font-semibold ${priceCol}`}>
          {fmtNum(level.price, mid && level.price > 100 ? 1 : 4)}
        </span>
        <span className="relative text-[11px] text-gray-300 font-mono w-20 text-right">
          {fmtK(level.qty)}
        </span>
        <span className="relative text-[11px] text-gray-400 font-mono w-24 text-right">
          ${fmtK(level.notional)}
        </span>
      </div>
    );
  }

  return (
    <div className="overflow-hidden flex flex-col select-none">
      {/* column header */}
      <div className="flex items-center px-2 py-1 text-[10px] text-gray-500 border-b border-terminal-border">
        <span className="flex-1">Price</span>
        <span className="w-20 text-right">Qty</span>
        <span className="w-24 text-right">Notional</span>
      </div>

      {layoutMode === 'top-bottom' ? (
        /* ── TOP/BOTTOM: asks above mid, bids below ── */
        <>
          <div className="overflow-y-auto" style={{ maxHeight: MAX_ROWS * ROW_H }}>
            {asks.map((l, i) => <Row key={`ask-${i}`} level={{ ...l, side: 'ask' }} side="ask" />)}
          </div>

          {mid != null && (
            <div className="flex items-center justify-between px-3 py-1 bg-yellow-500/10 border-y border-yellow-500/30 shrink-0">
              <span className="text-[11px] text-yellow-400 font-semibold">Mid</span>
              <span className="text-[14px] text-yellow-300 font-bold font-mono">{fmtNum(mid, mid > 100 ? 2 : 6)}</span>
              <span className="text-[11px] text-yellow-400 font-semibold">Mid</span>
            </div>
          )}

          <div className="overflow-y-auto" style={{ maxHeight: MAX_ROWS * ROW_H }}>
            {bids.map((l, i) => <Row key={`bid-${i}`} level={{ ...l, side: 'bid' }} side="bid" />)}
          </div>
        </>
      ) : (
        /* ── LEFT/RIGHT: asks on left column, bids on right column ── */
        <div className="flex overflow-hidden">
          {/* Left — Asks */}
          <div className="flex-1 flex flex-col min-w-0 border-r border-terminal-border">
            <div className="px-2 py-1 text-[10px] text-red-400 font-semibold border-b border-terminal-border bg-red-500/5 shrink-0">
              ▲ Asks
            </div>
            <div className="overflow-y-auto" style={{ maxHeight: MAX_ROWS * ROW_H }}>
              {/* show asks top-of-book last (closest to mid at bottom) */}
              {asks.map((l, i) => <Row key={`ask-${i}`} level={{ ...l, side: 'ask' }} side="ask" />)}
            </div>
          </div>

          {/* Mid divider */}
          {mid != null && (
            <div className="flex flex-col items-center justify-center w-24 shrink-0 bg-yellow-500/10 border-x border-yellow-500/30 px-1">
              <span className="text-[10px] text-yellow-400 font-semibold rotate-0 text-center leading-tight">Mid</span>
              <span className="text-[12px] text-yellow-300 font-bold font-mono text-center break-all leading-tight mt-1">
                {fmtNum(mid, mid > 100 ? 2 : 6)}
              </span>
            </div>
          )}

          {/* Right — Bids */}
          <div className="flex-1 flex flex-col min-w-0 border-l border-terminal-border">
            <div className="px-2 py-1 text-[10px] text-emerald-400 font-semibold border-b border-terminal-border bg-emerald-500/5 shrink-0">
              ▼ Bids
            </div>
            <div className="overflow-y-auto" style={{ maxHeight: MAX_ROWS * ROW_H }}>
              {bids.map((l, i) => <Row key={`bid-${i}`} level={{ ...l, side: 'bid' }} side="bid" />)}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── WebSocket live delta overlay ────────────────────────────────────────────

type OBDelta = {
  // price → qty  (0 = remove)
  bids: Record<string, number>;
  asks: Record<string, number>;
  lastUpdate: number;
  wsHost: string; // which WS host is actually connected
};

// Ordered list of WS hosts to try; first that connects wins.
const WS_HOSTS = [
  'wss://fstream.binance.com/ws',  // Futures stream (preferred)
  'wss://stream.binance.com:9443/ws', // Spot stream (fallback)
];

function useLiveOB(symbol: string, enabled: boolean): OBDelta {
  const [delta, setDelta] = useState<OBDelta>({ bids: {}, asks: {}, lastUpdate: 0, wsHost: '' });
  const wsRef = useRef<WebSocket | null>(null);
  const pingRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const hostIdxRef = useRef(0); // tracks which host to try next

  const connect = useCallback(() => {
    if (!enabled || !symbol) return;

    const stream = `${symbol.toLowerCase()}@depth@500ms`;
    const hostBase = WS_HOSTS[hostIdxRef.current % WS_HOSTS.length];
    const url = `${hostBase}/${stream}`;

    const ws = new WebSocket(url);
    wsRef.current = ws;

    ws.onmessage = (evt) => {
      try {
        const msg = JSON.parse(evt.data);
        const newBids: Record<string, number> = {};
        const newAsks: Record<string, number> = {};

        if (Array.isArray(msg.b)) {
          for (const [p, q] of msg.b) {
            newBids[p] = Number(q);
          }
        }
        if (Array.isArray(msg.a)) {
          for (const [p, q] of msg.a) {
            newAsks[p] = Number(q);
          }
        }

        setDelta((prev) => ({
          bids: { ...prev.bids, ...newBids },
          asks: { ...prev.asks, ...newAsks },
          lastUpdate: Date.now(),
          wsHost: hostBase,
        }));
      } catch {
        // ignore parse errors
      }
    };

    ws.onerror = () => ws.close();
    ws.onclose = () => {
      if (wsRef.current === ws) {
        // Try next host on failure, reconnect after 2s
        hostIdxRef.current += 1;
        setTimeout(connect, 2000);
      }
    };

    // keepalive ping
    if (pingRef.current) clearInterval(pingRef.current);
    pingRef.current = setInterval(() => {
      if (ws.readyState === WebSocket.OPEN) ws.send(JSON.stringify({ method: 'ping' }));
    }, 20_000);
  }, [symbol, enabled]);

  useEffect(() => {
    connect();
    return () => {
      if (wsRef.current) {
        const old = wsRef.current;
        wsRef.current = null; // prevent reconnect
        old.close();
      }
      if (pingRef.current) clearInterval(pingRef.current);
      setDelta({ bids: {}, asks: {}, lastUpdate: 0, wsHost: '' });
    };
  }, [connect]);

  return delta;
}

// ─── Liquidity Wall Analysis ─────────────────────────────────────────────────

type WallSignal = {
  price: number;
  notional: number;
  qty: number;
  side: 'bid' | 'ask';
  distPct: number;      // % distance from mid
  distAbs: number;      // absolute price distance from mid
  urgency: 'high' | 'medium' | 'low';
  label: string;        // human-readable summary line
  sub: string;          // interpretation line
};

function computeWallSignals(
  bidWalls: Wall[],
  askWalls: Wall[],
  mid: number | null,
): WallSignal[] {
  if (!mid || mid <= 0) return [];

  const signals: WallSignal[] = [];

  const process = (walls: Wall[], side: 'bid' | 'ask') => {
    for (const w of walls) {
      const distAbs = Math.abs(w.price - mid);
      const distPct = (distAbs / mid) * 100;

      // urgency thresholds: high < 0.3%, medium < 1%, low ≥ 1%
      const urgency: WallSignal['urgency'] =
        distPct < 0.3 ? 'high' : distPct < 1.0 ? 'medium' : 'low';

      const priceStr = fmtNum(w.price, w.price > 100 ? 2 : 6);
      const notionalStr = `$${fmtK(w.notional)}`;

      if (side === 'ask') {
        signals.push({
          price: w.price,
          notional: w.notional,
          qty: w.qty,
          side,
          distAbs,
          distPct,
          urgency,
          label: `Large sell wall detected near ${priceStr}`,
          sub: `This may act as short-term resistance. (${notionalStr}, ${distPct.toFixed(2)}% above mid)`,
        });
      } else {
        signals.push({
          price: w.price,
          notional: w.notional,
          qty: w.qty,
          side,
          distAbs,
          distPct,
          urgency,
          label: `Large bid wall at ${priceStr}`,
          sub: `Potential short-term support. (${notionalStr}, ${distPct.toFixed(2)}% below mid)`,
        });
      }
    }
  };

  process(askWalls, 'ask');
  process(bidWalls, 'bid');

  // Sort: high urgency first, then by proximity
  return signals.sort((a, b) => {
    const uOrder = { high: 0, medium: 1, low: 2 };
    if (uOrder[a.urgency] !== uOrder[b.urgency]) return uOrder[a.urgency] - uOrder[b.urgency];
    return a.distAbs - b.distAbs;
  });
}

// ─── Orderbook Imbalance ──────────────────────────────────────────────────────

type ImbalanceResult = {
  ratio: number;
  bidVol: number;
  askVol: number;
  tier: 'strong-bull' | 'bull' | 'balanced' | 'bear' | 'strong-bear';
  headline: string;
  detail: string;
  conclusion: string;
};

function computeImbalance(bidDepth: Level[], askDepth: Level[]): ImbalanceResult | null {
  const bidVol = bidDepth.reduce((s, l) => s + l.notional, 0);
  const askVol = askDepth.reduce((s, l) => s + l.notional, 0);
  if (!askVol || !bidVol) return null;

  const ratio = bidVol / askVol;

  let tier: ImbalanceResult['tier'];
  let headline: string;
  let detail: string;
  let conclusion: string;

  if (ratio >= 2.0) {
    tier = 'strong-bull';
    headline = 'Strong bullish imbalance detected.';
    detail = `Bid liquidity is ${ratio.toFixed(2)}× stronger than asks.`;
    conclusion = 'Heavy buy-side dominance. Potential upward price pressure.';
  } else if (ratio >= 1.5) {
    tier = 'bull';
    headline = 'Orderbook imbalance detected.';
    detail = `Bid liquidity is ${ratio.toFixed(2)}× stronger than asks.`;
    conclusion = 'Buy pressure dominates the current market.';
  } else if (ratio >= 1.3) {
    tier = 'bull';
    headline = 'Mild bullish imbalance.';
    detail = `Bid liquidity is ${ratio.toFixed(2)}× stronger than asks.`;
    conclusion = 'Slight buy-side edge. Watch for continuation.';
  } else if (ratio >= 0.7) {
    tier = 'balanced';
    headline = 'Orderbook is balanced.';
    detail = `Bid/ask ratio is ${ratio.toFixed(2)}×.`;
    conclusion = 'No dominant side. Market is in equilibrium.';
  } else if (ratio >= 0.5) {
    tier = 'bear';
    headline = 'Mild bearish imbalance.';
    detail = `Ask liquidity is ${(1 / ratio).toFixed(2)}× stronger than bids.`;
    conclusion = 'Slight sell-side edge. Watch for downside pressure.';
  } else {
    tier = 'strong-bear';
    headline = 'Strong bearish imbalance detected.';
    detail = `Ask liquidity is ${(1 / ratio).toFixed(2)}× stronger than bids.`;
    conclusion = 'Heavy sell-side dominance. Potential downward price pressure.';
  }

  return { ratio, bidVol, askVol, tier, headline, detail, conclusion };
}

function OBImbalancePanel({ bidDepth, askDepth }: {
  bidDepth: Level[];
  askDepth: Level[];
}) {
  const result = computeImbalance(bidDepth, askDepth);

  const tierStyle = {
    'strong-bull': {
      bar: 'bg-emerald-400',
      border: 'border-emerald-500/30 bg-emerald-500/5',
      badge: 'bg-emerald-500/20 text-emerald-300',
      icon: '▲▲',
      label: 'STRONG BULL',
      headCol: 'text-emerald-300',
    },
    'bull': {
      bar: 'bg-emerald-500',
      border: 'border-emerald-500/20 bg-emerald-500/5',
      badge: 'bg-emerald-500/15 text-emerald-400',
      icon: '▲',
      label: 'BULLISH',
      headCol: 'text-emerald-400',
    },
    'balanced': {
      bar: 'bg-yellow-400',
      border: 'border-yellow-500/20 bg-yellow-500/5',
      badge: 'bg-yellow-500/15 text-yellow-300',
      icon: '⇌',
      label: 'BALANCED',
      headCol: 'text-yellow-300',
    },
    'bear': {
      bar: 'bg-red-500',
      border: 'border-red-500/20 bg-red-500/5',
      badge: 'bg-red-500/15 text-red-400',
      icon: '▼',
      label: 'BEARISH',
      headCol: 'text-red-400',
    },
    'strong-bear': {
      bar: 'bg-red-400',
      border: 'border-red-500/30 bg-red-500/5',
      badge: 'bg-red-500/20 text-red-300',
      icon: '▼▼',
      label: 'STRONG BEAR',
      headCol: 'text-red-300',
    },
  };

  return (
    <div className="bg-terminal-panel border border-terminal-border rounded-lg p-4 space-y-3">
      <div className="text-xs font-semibold text-terminal-accent">Orderbook Imbalance</div>

      {!result ? (
        <div className="text-xs text-gray-500">Insufficient depth data.</div>
      ) : (
        <>
          {/* Bid vs Ask volume bar */}
          <div>
            <div className="flex justify-between text-[11px] mb-1">
              <span className="text-emerald-400 font-semibold">Bids ${fmtK(result.bidVol)}</span>
              <span className="text-gray-400 font-mono">{result.ratio.toFixed(3)}×</span>
              <span className="text-red-400 font-semibold">Asks ${fmtK(result.askVol)}</span>
            </div>
            <div className="relative h-4 bg-red-500/30 rounded overflow-hidden">
              {/* bid fill */}
              <div
                className={`absolute left-0 top-0 h-full ${tierStyle[result.tier].bar} transition-all duration-700`}
                style={{ width: `${Math.min(100, (result.bidVol / (result.bidVol + result.askVol)) * 100).toFixed(1)}%` }}
              />
              {/* center line */}
              <div className="absolute left-1/2 top-0 h-full w-px bg-white/20" />
              <div className="absolute inset-0 flex items-center justify-center text-[10px] font-bold text-white/70">
                {((result.bidVol / (result.bidVol + result.askVol)) * 100).toFixed(1)}% bid
              </div>
            </div>
          </div>

          {/* Signal card */}
          <div className={`rounded border px-3 py-2.5 space-y-1 ${tierStyle[result.tier].border}`}>
            <div className="flex items-center gap-2">
              <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${tierStyle[result.tier].badge}`}>
                {tierStyle[result.tier].icon} {tierStyle[result.tier].label}
              </span>
            </div>
            <div className={`text-[12px] font-semibold ${tierStyle[result.tier].headCol}`}>
              {result.headline}
            </div>
            <div className="text-[11px] text-gray-300">{result.detail}</div>
            <div className="text-[11px] text-gray-500 italic">{result.conclusion}</div>
          </div>

          {/* Ratio reference table */}
          <div className="grid grid-cols-3 gap-1 text-[10px] text-center">
            {[
              { range: '≥ 1.5', label: 'Bullish', col: 'text-emerald-400', active: result.ratio >= 1.5 },
              { range: '0.7–1.5', label: 'Balanced', col: 'text-yellow-400', active: result.ratio >= 0.7 && result.ratio < 1.5 },
              { range: '< 0.7', label: 'Bearish', col: 'text-red-400', active: result.ratio < 0.7 },
            ].map(({ range, label, col, active }) => (
              <div
                key={range}
                className={`rounded px-1 py-1 border transition-colors ${
                  active ? 'border-white/20 bg-white/5' : 'border-white/5 opacity-40'
                }`}
              >
                <div className={`font-bold font-mono ${col}`}>{range}</div>
                <div className="text-gray-500">{label}</div>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

// ─── Liquidity Cluster Detection ─────────────────────────────────────────────

type LiquidityCluster = {
  side: 'bid' | 'ask';
  priceMin: number;
  priceMax: number;
  totalNotional: number;
  totalQty: number;
  levelCount: number;
  role: string;   // e.g. "support area" or "resistance zone"
};

function computeClusters(bidDepth: Level[], askDepth: Level[], topN = 5): LiquidityCluster[] {
  const clusters: LiquidityCluster[] = [];

  function buildCluster(levels: Level[], side: 'bid' | 'ask'): LiquidityCluster | null {
    if (!levels.length) return null;
    // pick top-N by notional
    const top = [...levels].sort((a, b) => b.notional - a.notional).slice(0, topN);
    // sort by price to find contiguous price range
    top.sort((a, b) => a.price - b.price);
    const prices = top.map((l) => l.price);
    const totalNotional = top.reduce((s, l) => s + l.notional, 0);
    const totalQty = top.reduce((s, l) => s + l.qty, 0);
    return {
      side,
      priceMin: Math.min(...prices),
      priceMax: Math.max(...prices),
      totalNotional,
      totalQty,
      levelCount: top.length,
      role: side === 'bid' ? 'support area' : 'resistance zone',
    };
  }

  const bidCluster = buildCluster(bidDepth, 'bid');
  const askCluster = buildCluster(askDepth, 'ask');
  if (bidCluster) clusters.push(bidCluster);
  if (askCluster) clusters.push(askCluster);
  return clusters;
}

function LiquidityClusterPanel({
  bidDepth,
  askDepth,
  mid,
}: {
  bidDepth: Level[];
  askDepth: Level[];
  mid: number | null;
}) {
  const clusters = computeClusters(bidDepth, askDepth, 5);

  return (
    <div className="bg-terminal-panel border border-terminal-border rounded-lg p-4 space-y-3">
      {/* header */}
      <div className="flex items-center justify-between">
        <div className="text-xs font-semibold text-terminal-accent">Liquidity Cluster Detection</div>
        <span className="text-[10px] text-gray-500">Top-5 levels</span>
      </div>

      {clusters.length === 0 ? (
        <div className="text-xs text-gray-500">Insufficient depth data.</div>
      ) : (
        <div className="space-y-2">
          {clusters.map((c, i) => {
            const isBid = c.side === 'bid';
            const borderCol = isBid
              ? 'border-emerald-500/30 bg-emerald-500/5'
              : 'border-red-500/30 bg-red-500/5';
            const priceCol  = isBid ? 'text-emerald-300' : 'text-red-300';
            const badgeCol  = isBid
              ? 'bg-emerald-500/20 text-emerald-300'
              : 'bg-red-500/20 text-red-300';
            const sideLabel = isBid ? '▼ BID CLUSTER' : '▲ ASK CLUSTER';

            // distance from mid
            const distLine = mid
              ? (() => {
                  const centre = (c.priceMin + c.priceMax) / 2;
                  const distPct = (Math.abs(centre - mid) / mid) * 100;
                  return `${distPct.toFixed(2)}% from mid`;
                })()
              : null;

            const sameLine = Math.abs(c.priceMax - c.priceMin) < 1e-8;

            return (
              <div key={i} className={`rounded border px-3 py-2.5 space-y-1.5 ${borderCol}`}>
                {/* badge row */}
                <div className="flex items-center justify-between">
                  <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${badgeCol}`}>
                    {sideLabel}
                  </span>
                  {distLine && (
                    <span className="text-[10px] text-gray-500">{distLine}</span>
                  )}
                </div>

                {/* headline */}
                <div className={`text-[12px] font-semibold leading-snug ${priceCol}`}>
                  Liquidity cluster detected
                  {sameLine
                    ? <> at <span className="font-mono">{fmtNum(c.priceMin, c.priceMin > 100 ? 2 : 6)}</span></>
                    : <> between{' '}
                        <span className="font-mono">{fmtNum(c.priceMin, c.priceMin > 100 ? 2 : 6)}</span>
                        {' – '}
                        <span className="font-mono">{fmtNum(c.priceMax, c.priceMax > 100 ? 2 : 6)}</span>
                      </>
                  }
                </div>

                {/* interpretation */}
                <div className="text-[11px] text-gray-300">
                  This zone may act as a <span className={`font-semibold ${priceCol}`}>{c.role}</span>.
                </div>

                {/* stats */}
                <div className="flex items-center gap-4 text-[10px] text-gray-500 font-mono pt-0.5">
                  <span>
                    Notional{' '}
                    <span className="text-gray-300 font-semibold">${fmtK(c.totalNotional)}</span>
                  </span>
                  <span>
                    Qty{' '}
                    <span className="text-gray-300 font-semibold">{fmtK(c.totalQty)}</span>
                  </span>
                  <span>
                    Levels{' '}
                    <span className="text-gray-300 font-semibold">{c.levelCount}</span>
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

function WallAnalysisPanel({ bidWalls, askWalls, mid }: {
  bidWalls: Wall[];
  askWalls: Wall[];
  mid: number | null;
}) {
  const signals = computeWallSignals(bidWalls, askWalls, mid);

  const urgencyStyle = {
    high:   { dot: 'bg-orange-400', border: 'border-orange-500/30 bg-orange-500/5', badge: 'bg-orange-500/20 text-orange-300', label: 'HIGH' },
    medium: { dot: 'bg-yellow-400',  border: 'border-yellow-500/30 bg-yellow-500/5', badge: 'bg-yellow-500/20 text-yellow-300',  label: 'MED'  },
    low:    { dot: 'bg-gray-500',    border: 'border-gray-600/40 bg-gray-700/10',    badge: 'bg-gray-600/30 text-gray-400',      label: 'LOW'  },
  };

  return (
    <div className="bg-terminal-panel border border-terminal-border rounded-lg p-4">
      {/* header */}
      <div className="flex items-center justify-between mb-3">
        <div className="text-xs font-semibold text-terminal-accent">Liquidity Wall Analysis</div>
        {signals.length > 0 && (
          <span className="text-[10px] text-gray-500">{signals.length} signal{signals.length > 1 ? 's' : ''}</span>
        )}
      </div>

      {signals.length === 0 ? (
        <div className="text-xs text-gray-500">No significant walls near current price.</div>
      ) : (
        <div className="space-y-2">
          {signals.slice(0, 6).map((s, i) => {
            const st = urgencyStyle[s.urgency];
            const sideCol = s.side === 'ask' ? 'text-red-300' : 'text-emerald-300';
            const sideIcon = s.side === 'ask' ? '▲' : '▼';
            return (
              <div
                key={i}
                className={`rounded border px-3 py-2 space-y-1 ${st.border}`}
              >
                {/* top row: urgency badge + side icon + main label */}
                <div className="flex items-start gap-2">
                  <span className={`mt-0.5 inline-flex items-center gap-1 shrink-0 text-[9px] font-bold px-1.5 py-0.5 rounded ${st.badge}`}>
                    <span className={`w-1.5 h-1.5 rounded-full ${st.dot} inline-block`} />
                    {st.label}
                  </span>
                  <span className={`text-[12px] font-semibold leading-snug ${sideCol}`}>
                    {sideIcon} {s.label}
                  </span>
                </div>
                {/* sub-line */}
                <div className="text-[11px] text-gray-400 leading-snug pl-8">{s.sub}</div>
                {/* stats row */}
                <div className="flex items-center gap-3 pl-8 text-[10px] text-gray-500 font-mono">
                  <span>Qty <span className="text-gray-300">{fmtK(s.qty)}</span></span>
                  <span>Dist <span className="text-gray-300">{fmtNum(s.distAbs, s.distAbs > 1 ? 1 : 4)}</span></span>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* no-wall states */}
      {signals.length > 0 && signals.filter(s => s.urgency === 'high').length === 0 && (
        <div className="mt-3 pt-2 border-t border-white/5 text-[11px] text-gray-500">
          ℹ️ No high-urgency walls within 0.3% of mid price.
        </div>
      )}
    </div>
  );
}

// ─── Spoofing / Fake Wall Detection ──────────────────────────────────────────

const SPOOF_WINDOW_MS = 5000;   // look-back window
const SPOOF_DROP_THRESHOLD = 0.70; // 70% drop triggers alert
const SPOOF_MIN_NOTIONAL = 50_000; // only track levels with significant notional
const SPOOF_MAX_ALERTS = 5;       // max alerts to show at once

type SpoofAlert = {
  id: string;           // price+side key
  price: number;
  side: 'bid' | 'ask';
  prevQty: number;
  currQty: number;
  dropPct: number;      // e.g. 0.82 = 82% drop
  detectedAt: number;   // timestamp ms
};

type LevelSnapshot = {
  qty: number;
  notional: number;
  ts: number;
};

function useSpoofingDetector(
  bidDepth: Level[],
  askDepth: Level[],
): SpoofAlert[] {
  // price-key → last snapshot
  const snapshotRef = useRef<Map<string, LevelSnapshot>>(new Map());
  const [alerts, setAlerts] = useState<SpoofAlert[]>([]);

  useEffect(() => {
    const now = Date.now();
    const newAlerts: SpoofAlert[] = [];
    const snap = snapshotRef.current;

    const check = (levels: Level[], side: 'bid' | 'ask') => {
      const currentKeys = new Set<string>();

      for (const lvl of levels) {
        const key = `${side}:${lvl.price}`;
        currentKeys.add(key);
        const prev = snap.get(key);

        if (prev) {
          const ageSecs = (now - prev.ts) / 1000;
          // Only flag if within window AND had significant size before
          if (
            ageSecs <= SPOOF_WINDOW_MS / 1000 &&
            prev.notional >= SPOOF_MIN_NOTIONAL &&
            prev.qty > 0 &&
            lvl.qty < prev.qty
          ) {
            const dropPct = 1 - lvl.qty / prev.qty;
            if (dropPct >= SPOOF_DROP_THRESHOLD) {
              newAlerts.push({
                id: key,
                price: lvl.price,
                side,
                prevQty: prev.qty,
                currQty: lvl.qty,
                dropPct,
                detectedAt: now,
              });
            }
          }
        }

        // update snapshot
        snap.set(key, { qty: lvl.qty, notional: lvl.notional, ts: now });
      }

      // Also check levels that disappeared entirely (qty → 0 = wall removed)
      for (const [key, prev] of snap.entries()) {
        if (!key.startsWith(side + ':')) continue;
        if (currentKeys.has(key)) continue;
        const ageSecs = (now - prev.ts) / 1000;
        if (
          ageSecs <= SPOOF_WINDOW_MS / 1000 &&
          prev.notional >= SPOOF_MIN_NOTIONAL &&
          prev.qty > 0
        ) {
          const priceStr = key.split(':')[1];
          newAlerts.push({
            id: key,
            price: Number(priceStr),
            side,
            prevQty: prev.qty,
            currQty: 0,
            dropPct: 1,
            detectedAt: now,
          });
          // remove from snapshot so we don't re-alert
          snap.delete(key);
        }
      }
    };

    check(bidDepth, 'bid');
    check(askDepth, 'ask');

    // Merge new alerts + expire old ones in a single setState
    setAlerts((prev) => {
      const map = new Map(prev.map((a) => [a.id, a]));
      for (const a of newAlerts) map.set(a.id, a);
      return Array.from(map.values())
        .filter((a) => now - a.detectedAt < 30_000)
        .sort((a, b) => b.detectedAt - a.detectedAt)
        .slice(0, SPOOF_MAX_ALERTS);
    });
  }, [bidDepth, askDepth]);

  return alerts;
}

function SpoofingWarningPanel({ alerts }: { alerts: SpoofAlert[] }) {
  const now = Date.now();

  return (
    <div className="bg-terminal-panel border border-terminal-border rounded-lg p-4 space-y-3">
      {/* header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="text-xs font-semibold text-terminal-accent">Spoofing / Fake Wall Warning</div>
          {alerts.length > 0 && (
            <span className="w-2 h-2 rounded-full bg-orange-400 animate-pulse inline-block" />
          )}
        </div>
        <span className="text-[10px] text-gray-500">
          {alerts.length === 0 ? 'Monitoring…' : `${alerts.length} alert${alerts.length > 1 ? 's' : ''}`}
        </span>
      </div>

      {alerts.length === 0 ? (
        <div className="flex items-center gap-2 text-xs text-gray-500">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 inline-block" />
          No suspicious wall activity detected.
        </div>
      ) : (
        <div className="space-y-2">
          {alerts.map((a) => {
            const isSell = a.side === 'ask';
            const borderCol = isSell
              ? 'border-orange-500/40 bg-orange-500/5'
              : 'border-yellow-500/40 bg-yellow-500/5';
            const priceCol = isSell ? 'text-red-300' : 'text-emerald-300';
            const ageS = Math.round((now - a.detectedAt) / 1000);
            const headline = a.currQty === 0
              ? `Large ${isSell ? 'sell' : 'buy'} wall removed quickly.`
              : `Large ${isSell ? 'sell' : 'buy'} wall dropped ${(a.dropPct * 100).toFixed(0)}%.`;
            const detail = a.currQty === 0
              ? `Wall at ${fmtNum(a.price, a.price > 100 ? 2 : 6)} vanished (was ${fmtK(a.prevQty)}).`
              : `${fmtNum(a.price, a.price > 100 ? 2 : 6)}: ${fmtK(a.prevQty)} → ${fmtK(a.currQty)}`;

            return (
              <div key={a.id} className={`rounded border px-3 py-2.5 space-y-1 ${borderCol}`}>
                {/* top row */}
                <div className="flex items-center justify-between gap-2">
                  <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-orange-500/25 text-orange-300">
                    ⚠ SPOOF?
                  </span>
                  <span className="text-[10px] text-gray-500 font-mono">{ageS}s ago</span>
                </div>
                {/* headline */}
                <div className="text-[12px] font-semibold text-orange-200">
                  {headline}
                </div>
                {/* detail */}
                <div className={`text-[11px] font-mono ${priceCol}`}>{detail}</div>
                {/* conclusion */}
                <div className="text-[11px] text-gray-400 italic">
                  Possible spoofing behavior detected.
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* info footer */}
      <div className="pt-1 border-t border-white/5 text-[10px] text-gray-600">
        Triggers when a wall drops &gt;{(SPOOF_DROP_THRESHOLD * 100).toFixed(0)}% within {SPOOF_WINDOW_MS / 1000}s · min ${fmtK(SPOOF_MIN_NOTIONAL)} notional
      </div>
    </div>
  );
}

type LayoutMode = 'top-bottom' | 'left-right';

// ─── Spread Analysis ──────────────────────────────────────────────────────────

type SpreadTier = 'tight' | 'normal' | 'wide' | 'very-wide';

function classifySpread(spreadPct: number): SpreadTier {
  if (spreadPct < 0.02) return 'tight';
  if (spreadPct < 0.05) return 'normal';
  if (spreadPct < 0.15) return 'wide';
  return 'very-wide';
}

function SpreadAnalysisPanel({
  spread,
  spreadPct,
  bestBid,
  bestAsk,
}: {
  spread: number | null;
  spreadPct: number | null;
  bestBid: number | null;
  bestAsk: number | null;
}) {
  const tierStyle: Record<SpreadTier, {
    border: string; badge: string; label: string; dot: string; headCol: string;
  }> = {
    'tight':     { border: 'border-emerald-500/30 bg-emerald-500/5', badge: 'bg-emerald-500/20 text-emerald-300', label: 'TIGHT',     dot: 'bg-emerald-400', headCol: 'text-emerald-300' },
    'normal':    { border: 'border-sky-500/30 bg-sky-500/5',         badge: 'bg-sky-500/20 text-sky-300',         label: 'NORMAL',    dot: 'bg-sky-400',     headCol: 'text-sky-300'     },
    'wide':      { border: 'border-yellow-500/30 bg-yellow-500/5',   badge: 'bg-yellow-500/20 text-yellow-300',   label: 'WIDE',      dot: 'bg-yellow-400',  headCol: 'text-yellow-300'  },
    'very-wide': { border: 'border-red-500/30 bg-red-500/5',         badge: 'bg-red-500/20 text-red-300',         label: 'VERY WIDE', dot: 'bg-red-400',     headCol: 'text-red-300'     },
  };

  const tier = spreadPct != null ? classifySpread(spreadPct) : null;
  const st = tier ? tierStyle[tier] : null;

  const headline =
    tier === 'tight'     ? 'Spread is tight — high liquidity conditions.' :
    tier === 'normal'    ? 'Spread is within normal range.' :
    tier === 'wide'      ? 'Spread widening detected.' :
    tier === 'very-wide' ? 'Spread is very wide — low liquidity / high volatility.' :
    null;

  const interpretation =
    tier === 'tight'     ? 'Low cost to enter/exit. Market makers are active.' :
    tier === 'normal'    ? 'Typical market conditions. No unusual spread activity.' :
    tier === 'wide'      ? 'Spread widening may indicate lower liquidity and higher volatility.' :
    tier === 'very-wide' ? 'Extreme spread. Exercise caution — slippage risk is elevated.' :
    null;

  // Gauge: map spreadPct 0–0.2% → bar width 0–100%
  const gaugeW = spreadPct != null ? Math.min(100, (spreadPct / 0.2) * 100) : 0;
  const gaugeCol =
    tier === 'tight' ? 'bg-emerald-500' :
    tier === 'normal' ? 'bg-sky-500' :
    tier === 'wide' ? 'bg-yellow-500' : 'bg-red-500';

  return (
    <div className="bg-terminal-panel border border-terminal-border rounded-lg p-4 space-y-3">
      <div className="text-xs font-semibold text-terminal-accent">Spread Analysis</div>

      {spread == null || spreadPct == null || !st ? (
        <div className="text-xs text-gray-500">Insufficient data.</div>
      ) : (
        <>
          {/* numeric row */}
          <div className="flex items-center justify-between text-[11px] font-mono">
            <span className="text-emerald-400">{fmtNum(bestBid, bestBid && bestBid > 100 ? 2 : 6)}</span>
            <div className="text-center">
              <div className="text-gray-400">Spread</div>
              <div className="text-yellow-300 font-bold">{fmtNum(spread, spread > 1 ? 4 : 6)}</div>
              <div className="text-gray-500">{(spreadPct).toFixed(4)}%</div>
            </div>
            <span className="text-red-400">{fmtNum(bestAsk, bestAsk && bestAsk > 100 ? 2 : 6)}</span>
          </div>

          {/* gauge bar */}
          <div>
            <div className="flex justify-between text-[10px] text-gray-600 mb-1">
              <span>0% (tight)</span>
              <span>≥0.2% (wide)</span>
            </div>
            <div className="relative h-3 bg-gray-700 rounded overflow-hidden">
              <div
                className={`absolute left-0 top-0 h-full ${gaugeCol} transition-all duration-700`}
                style={{ width: `${gaugeW.toFixed(1)}%` }}
              />
            </div>
          </div>

          {/* signal card */}
          <div className={`rounded border px-3 py-2.5 space-y-1 ${st.border}`}>
            <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded inline-flex items-center gap-1 ${st.badge}`}>
              <span className={`w-1.5 h-1.5 rounded-full ${st.dot} inline-block`} />
              {st.label}
            </span>
            <div className={`text-[12px] font-semibold ${st.headCol}`}>{headline}</div>
            <div className="text-[11px] text-gray-400 italic">{interpretation}</div>
          </div>

          {/* reference table */}
          <div className="grid grid-cols-4 gap-1 text-[10px] text-center">
            {(
              [
                { label: '<0.02%', name: 'Tight',     col: 'text-emerald-400', active: tier === 'tight'     },
                { label: '<0.05%', name: 'Normal',    col: 'text-sky-400',     active: tier === 'normal'    },
                { label: '<0.15%', name: 'Wide',      col: 'text-yellow-400',  active: tier === 'wide'      },
                { label: '≥0.15%', name: 'Very Wide', col: 'text-red-400',     active: tier === 'very-wide' },
              ] as { label: string; name: string; col: string; active: boolean }[]
            ).map(({ label, name, col, active }) => (
              <div
                key={name}
                className={`rounded px-1 py-1 border ${active ? 'border-white/20 bg-white/5' : 'border-white/5 opacity-40'}`}
              >
                <div className={`font-bold font-mono ${col}`}>{label}</div>
                <div className="text-gray-500">{name}</div>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

// ─── Short-Term Bias ──────────────────────────────────────────────────────────

type BiasTier = 'strong-bull' | 'bull' | 'neutral' | 'bear' | 'strong-bear';

type BiasResult = {
  tier: BiasTier;
  score: number;          // -4 to +4
  headline: string;
  reasons: string[];
  caution: string | null;
};

function computeBias({
  pressureRatio,
  pressureSide,
  imbalanceTier,
  bidWalls,
  askWalls,
  mid,
  spreadTier,
  takerBuyPct,
}: {
  pressureRatio: number | null;
  pressureSide: 'BUY' | 'SELL' | 'NEUTRAL' | null;
  imbalanceTier: 'strong-bull' | 'bull' | 'balanced' | 'bear' | 'strong-bear' | null;
  bidWalls: Wall[];
  askWalls: Wall[];
  mid: number | null;
  spreadTier: SpreadTier | null;
  takerBuyPct: number | null;
}): BiasResult {
  let score = 0;
  const reasons: string[] = [];

  // 1. Orderbook imbalance (+2 / -2)
  if (imbalanceTier === 'strong-bull') { score += 2; reasons.push('Strong bid-side dominance in orderbook.'); }
  else if (imbalanceTier === 'bull')   { score += 1; reasons.push('Bid liquidity outweighs asks.'); }
  else if (imbalanceTier === 'bear')   { score -= 1; reasons.push('Ask liquidity outweighs bids.'); }
  else if (imbalanceTier === 'strong-bear') { score -= 2; reasons.push('Strong ask-side dominance in orderbook.'); }

  // 2. Market pressure (+1 / -1)
  if (pressureSide === 'BUY')  { score += 1; reasons.push('Buy pressure dominates (pressure ratio: ' + (pressureRatio?.toFixed(2) ?? '—') + '×).'); }
  if (pressureSide === 'SELL') { score -= 1; reasons.push('Sell pressure dominates (pressure ratio: ' + (pressureRatio?.toFixed(2) ?? '—') + '×).'); }

  // 3. Taker flow (+1 / -1)
  if (takerBuyPct != null) {
    if (takerBuyPct >= 0.60)      { score += 1; reasons.push(`Taker buy flow is dominant (${(takerBuyPct * 100).toFixed(1)}%).`); }
    else if (takerBuyPct <= 0.40) { score -= 1; reasons.push(`Taker sell flow is dominant (${((1 - takerBuyPct) * 100).toFixed(1)}%).`); }
  }

  // 4. Nearby walls — bid walls close below mid = support (+1), ask walls close above = resistance (-1)
  if (mid != null && mid > 0) {
    const nearBid = bidWalls.filter(w => (mid - w.price) / mid < 0.01);
    const nearAsk = askWalls.filter(w => (w.price - mid) / mid < 0.01);
    if (nearBid.length > 0) { score += 1; reasons.push('Strong bid liquidity wall(s) detected below price.'); }
    if (nearAsk.length > 0) { score -= 1; reasons.push('Large sell wall(s) detected above price.'); }
  }

  // classify
  let tier: BiasTier;
  if (score >= 3)      tier = 'strong-bull';
  else if (score >= 1) tier = 'bull';
  else if (score <= -3) tier = 'strong-bear';
  else if (score <= -1) tier = 'bear';
  else                  tier = 'neutral';

  const headlines: Record<BiasTier, string> = {
    'strong-bull': 'Short-term bias: strongly bullish.',
    'bull':        'Short-term bias: bullish.',
    'neutral':     'Short-term bias: neutral.',
    'bear':        'Short-term bias: bearish.',
    'strong-bear': 'Short-term bias: strongly bearish.',
  };

  const caution = spreadTier === 'very-wide' || spreadTier === 'wide'
    ? 'Note: spread is elevated — signal reliability reduced.'
    : null;

  return { tier, score, headline: headlines[tier], reasons, caution };
}

function ShortTermBiasPanel({
  pressure,
  bidWalls,
  askWalls,
  mid,
  spreadPct,
  bidDepth,
  askDepth,
}: {
  pressure: Pressure | null | undefined;
  bidWalls: Wall[];
  askWalls: Wall[];
  mid: number | null;
  spreadPct: number | null;
  bidDepth: Level[];
  askDepth: Level[];
}) {
  // derive imbalance tier live
  const bidVol = bidDepth.reduce((s, l) => s + l.notional, 0);
  const askVol = askDepth.reduce((s, l) => s + l.notional, 0);
  const obRatio = askVol > 0 ? bidVol / askVol : null;
  const imbalanceTier =
    obRatio == null ? null :
    obRatio >= 2.0  ? 'strong-bull' :
    obRatio >= 1.3  ? 'bull' :
    obRatio >= 0.7  ? 'balanced' :
    obRatio >= 0.5  ? 'bear' : 'strong-bear';

  const spreadTier = spreadPct != null ? classifySpread(spreadPct) : null;

  const bias = computeBias({
    pressureRatio: pressure?.pressureRatio ?? null,
    pressureSide:  pressure?.pressureSide  ?? null,
    imbalanceTier,
    bidWalls,
    askWalls,
    mid,
    spreadTier,
    takerBuyPct: pressure?.takerBuyPct ?? null,
  });

  const tierStyle: Record<BiasTier, {
    border: string; badge: string; label: string; icon: string; headCol: string; barCol: string;
  }> = {
    'strong-bull': { border: 'border-emerald-500/40 bg-emerald-500/8',  badge: 'bg-emerald-500/25 text-emerald-200', label: 'STRONGLY BULLISH', icon: '▲▲', headCol: 'text-emerald-200', barCol: 'bg-emerald-400' },
    'bull':        { border: 'border-emerald-500/25 bg-emerald-500/5',  badge: 'bg-emerald-500/15 text-emerald-300', label: 'BULLISH',          icon: '▲',  headCol: 'text-emerald-300', barCol: 'bg-emerald-500' },
    'neutral':     { border: 'border-yellow-500/25 bg-yellow-500/5',    badge: 'bg-yellow-500/15 text-yellow-300',   label: 'NEUTRAL',          icon: '⇌',  headCol: 'text-yellow-300',  barCol: 'bg-yellow-400' },
    'bear':        { border: 'border-red-500/25 bg-red-500/5',          badge: 'bg-red-500/15 text-red-300',         label: 'BEARISH',          icon: '▼',  headCol: 'text-red-300',     barCol: 'bg-red-500'    },
    'strong-bear': { border: 'border-red-500/40 bg-red-500/8',          badge: 'bg-red-500/25 text-red-200',         label: 'STRONGLY BEARISH', icon: '▼▼', headCol: 'text-red-200',     barCol: 'bg-red-400'    },
  };
  const st = tierStyle[bias.tier];

  // score bar: -4..+4 → 0..100%
  const barPct = ((bias.score + 4) / 8) * 100;

  return (
    <div className="bg-terminal-panel border border-terminal-border rounded-lg p-4 space-y-3">
      {/* header */}
      <div className="text-xs font-semibold text-terminal-accent">Short-Term Bias</div>

      {/* score bar */}
      <div>
        <div className="flex justify-between text-[10px] text-gray-600 mb-1">
          <span>Bearish</span>
          <span className="text-gray-400">Score: {bias.score > 0 ? '+' : ''}{bias.score}</span>
          <span>Bullish</span>
        </div>
        <div className="relative h-4 bg-gray-700 rounded overflow-hidden">
          {/* center marker */}
          <div className="absolute left-1/2 top-0 h-full w-px bg-white/20" />
          <div
            className={`absolute top-0 h-full ${st.barCol} transition-all duration-700`}
            style={
              bias.score >= 0
                ? { left: '50%', width: `${(barPct - 50).toFixed(1)}%` }
                : { right: `${(50 - barPct).toFixed(1)}%`, left: `${barPct.toFixed(1)}%`, width: `${(50 - barPct).toFixed(1)}%` }
            }
          />
        </div>
      </div>

      {/* signal card */}
      <div className={`rounded border px-3 py-2.5 space-y-2 ${st.border}`}>
        <div className="flex items-center gap-2">
          <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${st.badge}`}>
            {st.icon} {st.label}
          </span>
        </div>
        <div className={`text-[13px] font-bold ${st.headCol}`}>{bias.headline}</div>

        {/* reasons list */}
        {bias.reasons.length > 0 && (
          <ul className="space-y-1">
            {bias.reasons.map((r, i) => (
              <li key={i} className="flex items-start gap-1.5 text-[11px] text-gray-300">
                <span className={`mt-0.5 shrink-0 text-[8px] ${st.headCol}`}>◆</span>
                {r}
              </li>
            ))}
          </ul>
        )}

        {/* caution */}
        {bias.caution && (
          <div className="text-[11px] text-yellow-400/80 italic border-t border-white/5 pt-1.5">
            ⚠ {bias.caution}
          </div>
        )}
      </div>

      {/* disclaimer */}
      <div className="text-[10px] text-gray-600 leading-snug">
        Composite of: OB imbalance · market pressure · taker flow · nearby walls.
        Not financial advice.
      </div>
    </div>
  );
}

export default function HeatmapTerminal() {
  const [symbol, setSymbol] = useState('BTCUSDT');
  const [symbolInput, setSymbolInput] = useState('BTCUSDT');
  const [liveEnabled, setLiveEnabled] = useState(true);
  const [showWalls, setShowWalls] = useState(true);
  const [layout, setLayout] = useState<LayoutMode>('top-bottom');

  const qs = new URLSearchParams({ symbol });
  const { data: apiRes, isLoading } = useSWR<ApiRes>(
    `/api/heatmap?${qs}`,
    fetcher,
    { refreshInterval: 4000, revalidateOnFocus: false }
  );

  const ok = apiRes?.success === true;
  const d = ok ? apiRes!.data! : null;

  // WebSocket live orderbook delta
  const liveOB = useLiveOB(symbol, liveEnabled);
  const wsConnected = liveOB.lastUpdate > 0 && Date.now() - liveOB.lastUpdate < 3000;

  // Merge REST snapshot with WS delta for heatmap display
  const mergedBidDepth = useMemo<Level[]>(() => {
    if (!d) return [];
    if (!liveEnabled || !wsConnected) return d.bidDepth;

    const map = new Map<number, number>();
    for (const l of d.bidDepth) map.set(l.price, l.qty);
    for (const [pStr, qty] of Object.entries(liveOB.bids)) {
      const p = Number(pStr);
      if (qty === 0) map.delete(p);
      else map.set(p, qty);
    }
    const sorted = Array.from(map.entries())
      .sort((a, b) => b[0] - a[0])
      .slice(0, MAX_ROWS);
    let cum = 0;
    return sorted.map(([price, qty]) => {
      cum += qty;
      return { price, qty, notional: price * qty, cumQty: cum, side: 'bid' as const };
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [d, liveEnabled, wsConnected, liveOB.bids, liveOB.lastUpdate]);

  const mergedAskDepth = useMemo<Level[]>(() => {
    if (!d) return [];
    if (!liveEnabled || !wsConnected) return d.askDepth;

    const map = new Map<number, number>();
    for (const l of d.askDepth) map.set(l.price, l.qty);
    for (const [pStr, qty] of Object.entries(liveOB.asks)) {
      const p = Number(pStr);
      if (qty === 0) map.delete(p);
      else map.set(p, qty);
    }
    const sorted = Array.from(map.entries())
      .sort((a, b) => a[0] - b[0])
      .slice(0, MAX_ROWS);
    let cum = 0;
    return sorted.map(([price, qty]) => {
      cum += qty;
      return { price, qty, notional: price * qty, cumQty: cum, side: 'ask' as const };
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [d, liveEnabled, wsConnected, liveOB.asks, liveOB.lastUpdate]);

  const maxNotional = Math.max(
    ...mergedBidDepth.map((l) => l.notional),
    ...mergedAskDepth.map((l) => l.notional),
    1
  );

  function applySymbol() {
    const s = symbolInput.trim().toUpperCase();
    if (s && /^[A-Z0-9]{2,20}$/.test(s)) setSymbol(s);
  }

  const pressure = d?.pressure;
  const pSide = pressure?.pressureSide;

  // Spoofing detector — watches merged depth for rapid wall disappearance
  const spoofAlerts = useSpoofingDetector(mergedBidDepth, mergedAskDepth);

  return (
    <div className="space-y-4">
      {/* ── Header ── */}
      <div className="bg-terminal-panel rounded-lg border border-terminal-border p-4">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div>
            <div className="text-sm font-semibold text-terminal-accent">Orderbook Liquidity Heatmap</div>
            <div className="text-xs text-gray-500">Liquidity walls · buy/sell pressure · market microstructure</div>
          </div>

          {/* Symbol selector */}
          <div className="flex items-center gap-2 flex-wrap">
            <input
              list="hm-pairs"
              value={symbolInput}
              onChange={(e) => setSymbolInput(e.target.value.toUpperCase())}
              onKeyDown={(e) => e.key === 'Enter' && applySymbol()}
              className="bg-terminal-bg border border-terminal-border rounded px-3 py-1.5 text-sm text-terminal-text w-36 focus:outline-none focus:border-terminal-accent"
              placeholder="Symbol"
              spellCheck={false}
            />
            <datalist id="hm-pairs">
              {COMMON_PAIRS.map((p) => <option key={p} value={p} />)}
            </datalist>
            <button
              onClick={applySymbol}
              className="px-3 py-1.5 rounded text-xs bg-terminal-accent text-black font-semibold hover:bg-terminal-accent/80"
            >
              Load
            </button>

            {/* Live WS toggle */}
            <button
              onClick={() => setLiveEnabled((v) => !v)}
              className={`px-3 py-1.5 rounded text-xs border font-semibold transition-colors ${
                liveEnabled
                  ? 'border-emerald-500/40 bg-emerald-500/10 text-emerald-300'
                  : 'border-gray-600 bg-gray-700/30 text-gray-400'
              }`}
            >
              {liveEnabled
                ? wsConnected
                  ? `● LIVE ${liveOB.wsHost.includes('fstream') ? '(futures)' : '(spot)'}`
                  : '○ WS…'
                : 'Live OFF'}
            </button>

            {/* Data source badge (REST) */}
            {d?.depthSource && (
              <span className={`px-2 py-1.5 rounded text-[11px] border font-semibold ${
                d.depthSource === 'spot-fallback'
                  ? 'border-yellow-500/40 bg-yellow-500/10 text-yellow-300'
                  : 'border-sky-500/30 bg-sky-500/10 text-sky-300'
              }`}>
                {d.depthSource === 'spot-fallback' ? 'Spot REST' : 'Futures REST'}
              </span>
            )}

            {/* Wall highlight toggle */}
            <button
              onClick={() => setShowWalls((v) => !v)}
              className={`px-3 py-1.5 rounded text-xs border font-semibold transition-colors ${
                showWalls
                  ? 'border-yellow-500/40 bg-yellow-500/10 text-yellow-300'
                  : 'border-gray-600 bg-gray-700/30 text-gray-400'
              }`}
            >
              Walls {showWalls ? 'ON' : 'OFF'}
            </button>

            {/* Layout toggle */}
            <button
              onClick={() => setLayout((v) => v === 'top-bottom' ? 'left-right' : 'top-bottom')}
              title="Toggle heatmap layout"
              className="px-3 py-1.5 rounded text-xs border font-semibold transition-colors border-purple-500/40 bg-purple-500/10 text-purple-300 hover:bg-purple-500/20"
            >
              {layout === 'top-bottom' ? '⇅ Top/Bot' : '⇄ L/R'}
            </button>
          </div>
        </div>
      </div>

      {/* ── Stats row ── */}
      {d && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {[
            { label: 'Mid Price', value: fmtNum(d.mid, d.mid && d.mid > 100 ? 2 : 6), col: 'text-yellow-300' },
            { label: 'Spread', value: d.spread != null ? fmtNum(d.spread, 4) : '—', col: 'text-gray-200' },
            {
              label: 'Pressure',
              value: pSide ?? '—',
              col: pSide === 'BUY' ? 'text-emerald-400' : pSide === 'SELL' ? 'text-red-400' : 'text-yellow-400',
            },
            { label: 'Ratio (B/A)', value: pressure?.pressureRatio != null ? `${pressure.pressureRatio.toFixed(3)}×` : '—', col: 'text-gray-200' },
          ].map(({ label, value, col }) => (
            <div key={label} className="bg-terminal-panel border border-terminal-border rounded-lg px-3 py-2">
              <div className="text-[10px] text-gray-500 uppercase tracking-wide mb-0.5">{label}</div>
              <div className={`text-base font-bold font-mono ${col}`}>{value}</div>
            </div>
          ))}
        </div>
      )}

      {/* ── Main grid ── */}
      <div className={`grid gap-4 ${layout === 'left-right' ? 'grid-cols-1 2xl:grid-cols-3' : 'grid-cols-1 xl:grid-cols-3'}`}>

        {/* Heatmap panel */}
        <div
          className={`bg-terminal-panel border border-terminal-border rounded-lg flex flex-col overflow-hidden ${
            layout === 'left-right' ? '2xl:col-span-2' : 'xl:col-span-2'
          }`}
        >
          <div className="flex items-center justify-between px-4 py-2 border-b border-terminal-border">
            <div className="text-xs font-semibold text-terminal-accent">{symbol} — Depth Heatmap</div>
            {isLoading && <span className="text-[11px] text-gray-500 animate-pulse">Fetching…</span>}
            {d?.ts && !isLoading && (
              <span className="text-[10px] text-gray-600">
                {new Date(d.ts).toLocaleTimeString()}
              </span>
            )}
          </div>

          {!ok && !isLoading && (
            <div className="flex-1 flex items-center justify-center text-sm text-gray-500 p-6 text-center">
              {apiRes?.error ?? 'No data. Check symbol or try again.'}
            </div>
          )}

          {ok && d && (
            <>
              <HeatmapRows
                bidDepth={mergedBidDepth}
                askDepth={mergedAskDepth}
                maxNotional={maxNotional}
                mid={d.mid}
                bidWalls={showWalls ? d.bidWalls : []}
                askWalls={showWalls ? d.askWalls : []}
                layoutMode={layout}
              />
              <div className="mt-4 border-t border-terminal-border">
                <DepthChart
                  bidDepth={mergedBidDepth}
                  askDepth={mergedAskDepth}
                  mid={d.mid}
                  bidWalls={showWalls ? d.bidWalls : []}
                  askWalls={showWalls ? d.askWalls : []}
                />
              </div>
            </>
          )}
        </div>

        {/* Right side-panel */}
        <div className="space-y-4">

          {/* Spoofing Warning */}
          <SpoofingWarningPanel alerts={spoofAlerts} />

          {/* Pressure meters */}
          <div className="bg-terminal-panel border border-terminal-border rounded-lg p-4 space-y-4">
            <div className="text-xs font-semibold text-terminal-accent">Market Pressure</div>

            {pressure ? (
              <>
                <PressureBar ratio={pressure.pressureRatio} side={pressure.pressureSide} />
                <TakerBar pct={pressure.takerBuyPct} />

                <div className="grid grid-cols-2 gap-2 pt-1">
                  {[
                    { label: 'Bid Top-50 Notional', value: `$${fmtK(pressure.bidNotional50)}`, col: 'text-emerald-300' },
                    { label: 'Ask Top-50 Notional', value: `$${fmtK(pressure.askNotional50)}`, col: 'text-red-300' },
                    { label: 'Taker Buy Qty', value: fmtK(pressure.takerBuyQty), col: 'text-emerald-300' },
                    { label: 'Taker Sell Qty', value: fmtK(pressure.takerSellQty), col: 'text-red-300' },
                  ].map(({ label, value, col }) => (
                    <div key={label} className="bg-terminal-bg rounded p-2">
                      <div className="text-[10px] text-gray-500">{label}</div>
                      <div className={`text-sm font-bold font-mono ${col}`}>{value}</div>
                    </div>
                  ))}
                </div>
              </>
            ) : (
              <div className="text-sm text-gray-500">—</div>
            )}
          </div>

          {/* Liquidity walls */}
          <div className="bg-terminal-panel border border-terminal-border rounded-lg p-4">
            <div className="text-xs font-semibold text-terminal-accent mb-3">Liquidity Walls</div>

            {d && (d.bidWalls.length > 0 || d.askWalls.length > 0) ? (
              <div className="space-y-2">
                {[...d.askWalls, ...d.bidWalls]
                  .sort((a, b) => b.notional - a.notional)
                  .slice(0, 10)
                  .map((w, i) => (
                    <div
                      key={i}
                      className={`flex items-center justify-between px-2 py-1.5 rounded border text-xs font-mono ${wallBg(w.side)}`}
                    >
                      <span className="font-semibold">{w.side.toUpperCase()}</span>
                      <span>{fmtNum(w.price, w.price > 100 ? 2 : 6)}</span>
                      <span>{fmtK(w.qty)}</span>
                      <span className="font-semibold">${fmtK(w.notional)}</span>
                    </div>
                  ))}
              </div>
            ) : (
              <div className="text-sm text-gray-500">No significant walls detected</div>
            )}
          </div>

          {/* Orderbook Imbalance */}
          <OBImbalancePanel
            bidDepth={mergedBidDepth}
            askDepth={mergedAskDepth}
          />

          {/* Liquidity Cluster Detection */}
          <LiquidityClusterPanel
            bidDepth={mergedBidDepth}
            askDepth={mergedAskDepth}
            mid={d?.mid ?? null}
          />

          {/* Liquidity Wall Analysis */}
          <WallAnalysisPanel
            bidWalls={d?.bidWalls ?? []}
            askWalls={d?.askWalls ?? []}
            mid={d?.mid ?? null}
          />

          {/* Microstructure summary */}
          <div className="bg-terminal-panel border border-terminal-border rounded-lg p-4 space-y-2">
            <div className="text-xs font-semibold text-terminal-accent">Microstructure</div>
            {d ? (
              <div className="space-y-1 text-xs font-mono">
                {[
                  { label: 'Best Bid', value: fmtNum(d.bestBid, 4), col: 'text-emerald-300' },
                  { label: 'Best Ask', value: fmtNum(d.bestAsk, 4), col: 'text-red-300' },
                  { label: 'Spread', value: d.spread != null ? fmtNum(d.spread, 4) : '—', col: 'text-yellow-300' },
                  {
                    label: 'Spread %',
                    value: d.spread != null && d.mid ? `${((d.spread / d.mid) * 100).toFixed(4)}%` : '—',
                    col: 'text-gray-300',
                  },
                  { label: 'Max Level $', value: `$${fmtK(d.maxNotional)}`, col: 'text-purple-300' },
                ].map(({ label, value, col }) => (
                  <div key={label} className="flex justify-between py-0.5 border-b border-white/5">
                    <span className="text-gray-500">{label}</span>
                    <span className={col}>{value}</span>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-sm text-gray-500">—</div>
            )}
          </div>

          {/* Spread Analysis */}
          <SpreadAnalysisPanel
            spread={d?.spread ?? null}
            spreadPct={d?.spread != null && d?.mid ? (d.spread / d.mid) * 100 : null}
            bestBid={d?.bestBid ?? null}
            bestAsk={d?.bestAsk ?? null}
          />

          {/* Short-Term Bias */}
          <ShortTermBiasPanel
            pressure={d?.pressure}
            bidWalls={d?.bidWalls ?? []}
            askWalls={d?.askWalls ?? []}
            mid={d?.mid ?? null}
            spreadPct={d?.spread != null && d?.mid ? (d.spread / d.mid) * 100 : null}
            bidDepth={mergedBidDepth}
            askDepth={mergedAskDepth}
          />

          {/* Legend */}
          <div className="bg-terminal-panel border border-terminal-border rounded-lg p-3 text-[11px] text-gray-500 space-y-1">
            <div className="text-xs font-semibold text-gray-400 mb-1">Legend</div>
            <div className="flex items-center gap-2">
              <span className="inline-block w-4 h-3 rounded" style={{ background: 'rgba(16,185,129,0.5)' }} />
              <span>Bid liquidity (green = heavier)</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="inline-block w-4 h-3 rounded" style={{ background: 'rgba(239,68,68,0.5)' }} />
              <span>Ask liquidity (red = heavier)</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="inline-block px-1 text-[9px] bg-emerald-500/30 text-emerald-300 rounded font-bold">WALL</span>
              <span>Notional &gt;2.5× avg of top-20</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-yellow-300 font-bold">Mid</span>
              <span>= (bestBid + bestAsk) / 2</span>
            </div>
            <div className="mt-2 pt-2 border-t border-white/5">
              WS stream: <span className="text-gray-300">fstream.binance.com @depth 500ms</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
