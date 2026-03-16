'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
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

// ─── Heatmap rows ─────────────────────────────────────────────────────────────

function HeatmapRows({
  bidDepth,
  askDepth,
  maxNotional,
  mid,
  bidWalls,
  askWalls,
}: {
  bidDepth: Level[];
  askDepth: Level[];
  maxNotional: number;
  mid: number | null;
  bidWalls: Wall[];
  askWalls: Wall[];
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
    <div className="flex-1 min-h-0 overflow-hidden flex flex-col select-none">
      {/* header */}
      <div className="flex items-center px-2 py-1 text-[10px] text-gray-500 border-b border-terminal-border">
        <span className="flex-1">Price</span>
        <span className="w-20 text-right">Qty</span>
        <span className="w-24 text-right">Notional</span>
      </div>

      {/* asks (red, top) */}
      <div className="overflow-y-auto" style={{ maxHeight: MAX_ROWS * ROW_H }}>
        {asks.map((l, i) => (
          <Row key={`ask-${i}`} level={{ ...l, side: 'ask' }} side="ask" />
        ))}
      </div>

      {/* mid price separator */}
      {mid != null && (
        <div className="flex items-center justify-between px-3 py-1 bg-yellow-500/10 border-y border-yellow-500/30">
          <span className="text-[11px] text-yellow-400 font-semibold">Mid</span>
          <span className="text-[14px] text-yellow-300 font-bold font-mono">{fmtNum(mid, mid > 100 ? 2 : 6)}</span>
          <span className="text-[11px] text-yellow-400 font-semibold">Mid</span>
        </div>
      )}

      {/* bids (green, bottom) */}
      <div className="overflow-y-auto" style={{ maxHeight: MAX_ROWS * ROW_H }}>
        {bids.map((l, i) => (
          <Row key={`bid-${i}`} level={{ ...l, side: 'bid' }} side="bid" />
        ))}
      </div>
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

// ─── Main Component ──────────────────────────────────────────────────────────

export default function HeatmapTerminal() {
  const [symbol, setSymbol] = useState('BTCUSDT');
  const [symbolInput, setSymbolInput] = useState('BTCUSDT');
  const [liveEnabled, setLiveEnabled] = useState(true);
  const [showWalls, setShowWalls] = useState(true);

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
  const mergedBidDepth: Level[] = (() => {
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
  })();

  const mergedAskDepth: Level[] = (() => {
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
  })();

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
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">

        {/* Heatmap panel */}
        <div className="xl:col-span-2 bg-terminal-panel border border-terminal-border rounded-lg flex flex-col overflow-hidden" style={{ minHeight: 700 }}>
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
            <HeatmapRows
              bidDepth={mergedBidDepth}
              askDepth={mergedAskDepth}
              maxNotional={maxNotional}
              mid={d.mid}
              bidWalls={showWalls ? d.bidWalls : []}
              askWalls={showWalls ? d.askWalls : []}
            />
          )}
        </div>

        {/* Right side-panel */}
        <div className="space-y-4">

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
