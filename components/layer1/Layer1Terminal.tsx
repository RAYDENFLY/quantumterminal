'use client';

import { useEffect, useMemo, useState } from 'react';
import useSWR from 'swr';

const fetcher = (url: string) => fetch(url).then((r) => r.json());

type OrderflowData = {
  aggr_buys?: { volume?: number; count?: number };
  aggr_sells?: { volume?: number; count?: number };
  delta?: number;
  ratio?: number;
  ts?: string;
};

type OrderbookData = {
  bids?: [number, number][];
  asks?: [number, number][];
  mid?: number;
  spread?: number;
  ts?: string;
};

type MicrostructureRes = {
  success?: boolean;
  data?: {
    symbol: string;
    window_sec: number;
    ts: string;
    cvd?: {
      delta_base_qty?: number;
      taker_buy_base_qty?: number;
      taker_sell_base_qty?: number;
      taker_buy_count?: number;
      taker_sell_count?: number;
    };
    trade_flow_speed?: {
      trades_per_sec?: number;
      aggr_base_qty_per_sec?: number;
    };
    micro_volatility?: {
      realized_vol_1m?: number | null;
      spread?: number | null;
      mid?: number | null;
    };
    imbalance?: {
      top_levels?: number;
      bid_sum_qty?: number;
      ask_sum_qty?: number;
      ratio?: number | null;
      side?: 'BID' | 'ASK' | null;
      abs_ratio?: number | null;
      flag_gt_3_to_1?: boolean;
      heatmap?: { level: number; bidQty: number; askQty: number; ratio: number | null }[];
    };
    whale?: {
      threshold_usdt?: number;
      top_wall?: { side: 'BID' | 'ASK'; price: number; qty: number; notional: number } | null;
    };
    alerts?: {
      buy_absorption_detected?: boolean;
      sell_absorption_detected?: boolean;
    };
    meters?: {
      micro_vol?: string;
      spread?: string;
      ob_velocity?: string;
    };
  };
};

type WhaleWallLogItem = {
  _id?: string;
  symbol: string;
  exchange: string;
  side: 'BID' | 'ASK';
  price: number;
  qty: number;
  notional_usdt: number;
  threshold_usdt: number;
  created_at: string;
};

type WhaleWallLogsRes = {
  success?: boolean;
  data?: { logs?: WhaleWallLogItem[] };
};

type PanelPrice = {
  id: string;
  symbol: string;
  exchange: string;
  mid: number | null;
  spread: number | null;
  ok: boolean;
};

type PanelConfig = {
  id: string;
  symbol: string;
  exchange: string;
  depth: 10 | 25 | 50 | 100;
};

type LayoutConfig = {
  panelCount: 4 | 6;
  panels: PanelConfig[];
};

const STORAGE_KEY = 'qt_layer1_layout_v1';
const SYMBOL_DATALIST_ID = 'qt-layer1-symbols-v1';

const COMMON_FUTURES_PAIRS = [
  'BTCUSDT',
  'ETHUSDT',
  'BNBUSDT',
  'SOLUSDT',
  'XRPUSDT',
  'ADAUSDT',
  'DOGEUSDT',
  'LINKUSDT',
  'AVAXUSDT',
  'SUIUSDT',
  'OPUSDT',
  'ARBUSDT',
  'TIAUSDT',
  'INJUSDT',
  'SEIUSDT',
  'PEPEUSDT',
  'WIFUSDT',
  'FLOKIUSDT',
  'NEARUSDT',
  'ATOMUSDT',
];

type SymbolsRes = {
  success?: boolean;
  data?: { symbols?: string[] };
};

function uniqId(prefix: string) {
  return `${prefix}-${Math.random().toString(16).slice(2)}`;
}

function makeDefaultLayout(): LayoutConfig {
  // Default: 6 panels (2x3)
  const panels: PanelConfig[] = [
    { id: 'p1', symbol: 'BTCUSDT', exchange: 'binance', depth: 50 },
    { id: 'p2', symbol: 'ETHUSDT', exchange: 'binance', depth: 50 },
    { id: 'p3', symbol: 'SOLUSDT', exchange: 'binance', depth: 50 },
    { id: 'p4', symbol: 'BNBUSDT', exchange: 'binance', depth: 50 },
    { id: 'p5', symbol: 'XRPUSDT', exchange: 'binance', depth: 50 },
    { id: 'p6', symbol: 'ADAUSDT', exchange: 'binance', depth: 50 },
  ];
  return { panelCount: 6, panels };
}

function safeParseLayout(raw: string | null): LayoutConfig | null {
  if (!raw) return null;
  try {
    const obj = JSON.parse(raw);
    if (obj?.panelCount !== 4 && obj?.panelCount !== 6) return null;
    if (!Array.isArray(obj?.panels)) return null;
    return obj as LayoutConfig;
  } catch {
    return null;
  }
}

function fmtNum(v: any, digits = 2) {
  const n = Number(v);
  if (!Number.isFinite(n)) return '—';
  return n.toLocaleString(undefined, { maximumFractionDigits: digits });
}

function fmtPct(v: any) {
  const n = Number(v);
  if (!Number.isFinite(n)) return '—';
  return `${(n * 100).toFixed(2)}%`;
}

function clamp01(n: number) {
  if (!Number.isFinite(n)) return 0;
  return Math.max(0, Math.min(1, n));
}

function pct(n: number) {
  return `${(clamp01(n) * 100).toFixed(0)}%`;
}

function ConnectedBadge({ ok }: { ok: boolean }) {
  return (
    <span
      className={`text-[11px] px-2 py-1 rounded border ${ok ? 'text-green-300 border-green-500/30 bg-green-500/10' : 'text-terminal-danger border-terminal-danger/30 bg-red-500/10'}`}
    >
      {ok ? 'Connected' : 'Not connected'}
    </span>
  );
}

function OrderbookPanel({ panel }: { panel: PanelConfig }) {
  const qs = new URLSearchParams({ symbol: panel.symbol, exchange: panel.exchange, depth: String(panel.depth) });
  const { data: res } = useSWR(`/api/layer1/orderbook?${qs.toString()}`, fetcher, { refreshInterval: 3000 });

  const ok = Boolean(res?.success);
  const ob: OrderbookData | null = ok ? res?.data : null;

  const bids = Array.isArray(ob?.bids) ? ob!.bids!.slice(0, panel.depth) : [];
  const asks = Array.isArray(ob?.asks) ? ob!.asks!.slice(0, panel.depth) : [];

  return (
    <div className="bg-terminal-panel rounded-lg border border-terminal-border overflow-hidden">
      <div className="p-3 border-b border-terminal-border flex items-center justify-between">
        <div className="text-xs font-semibold text-terminal-accent">
          {panel.symbol} <span className="text-gray-500">({panel.exchange})</span>
        </div>
        <ConnectedBadge ok={ok} />
      </div>

      <div className="p-3">
        <div className="flex items-center justify-between text-xs text-gray-400 mb-2">
          <div>Depth: {panel.depth}</div>
          <div className="text-gray-500">mid: {fmtNum(ob?.mid, 4)} • spread: {fmtNum(ob?.spread, 4)}</div>
        </div>

        <div className="grid grid-cols-2 gap-2">
          <div>
            <div className="text-[11px] text-gray-500 mb-1">Bids</div>
            <div className="space-y-1">
              {bids.length ? (
                bids.slice(0, 12).map((r, idx) => (
                  <div key={idx} className="flex justify-between text-xs">
                    <span className="text-green-300">{fmtNum(r[0], 4)}</span>
                    <span className="text-gray-300">{fmtNum(r[1], 4)}</span>
                  </div>
                ))
              ) : (
                <div className="text-xs text-gray-500">—</div>
              )}
            </div>
          </div>

          <div>
            <div className="text-[11px] text-gray-500 mb-1">Asks</div>
            <div className="space-y-1">
              {asks.length ? (
                asks.slice(0, 12).map((r, idx) => (
                  <div key={idx} className="flex justify-between text-xs">
                    <span className="text-red-300">{fmtNum(r[0], 4)}</span>
                    <span className="text-gray-300">{fmtNum(r[1], 4)}</span>
                  </div>
                ))
              ) : (
                <div className="text-xs text-gray-500">—</div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function PriceTickerRow({ panels }: { panels: PanelConfig[] }) {
  // Fetch mid/spread for each panel symbol (lightweight; shared with orderbook API)
  const results = panels.map((p) => {
    const qs = new URLSearchParams({ symbol: p.symbol, exchange: p.exchange, depth: '10' });
    // NOTE: useSWR in map is safe as long as panels length/order is stable.
    const { data: res } = useSWR(`/api/layer1/orderbook?${qs.toString()}`, fetcher, { refreshInterval: 3000 });
    const ok = Boolean(res?.success);
    const ob = ok ? (res?.data as OrderbookData) : null;
    const mid = typeof ob?.mid === 'number' && Number.isFinite(ob.mid) ? ob.mid : null;
    const spread = typeof ob?.spread === 'number' && Number.isFinite(ob.spread) ? ob.spread : null;
    return { id: p.id, symbol: p.symbol, exchange: p.exchange, mid, spread, ok } satisfies PanelPrice;
  });

  return (
    <div className="bg-terminal-bg rounded-lg p-3 border border-terminal-border">
      <div className="flex items-center gap-3 overflow-x-auto">
        {results.map((r) => (
          <div
            key={r.id}
            className="shrink-0 bg-terminal-panel border border-terminal-border rounded-lg px-3 py-2 min-w-[170px]"
          >
            <div className="flex items-center justify-between gap-2">
              <div className="text-xs font-semibold text-terminal-accent">{r.symbol}</div>
              <span className={`text-[10px] px-2 py-0.5 rounded border ${r.ok ? 'text-green-300 border-green-500/30 bg-green-500/10' : 'text-terminal-danger border-terminal-danger/30 bg-red-500/10'}`}>
                {r.ok ? 'Live' : 'Off'}
              </span>
            </div>
            <div className="mt-1 text-sm text-gray-100 font-semibold">{r.ok ? fmtNum(r.mid, 4) : '—'}</div>
            <div className="text-[11px] text-gray-500">spread: {r.ok ? fmtNum(r.spread, 4) : '—'}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function Layer1Terminal() {
  const [symbol, setSymbol] = useState('BTCUSDT');
  const [exchange, setExchange] = useState('binance');
  const [windowSec, setWindowSec] = useState(60);
  const [symbolQuery, setSymbolQuery] = useState('');

  const [whaleUsdt, setWhaleUsdt] = useState(250000);
  const [whaleLogsOpen, setWhaleLogsOpen] = useState(true);
  const [whaleSideFilter, setWhaleSideFilter] = useState<'ALL' | 'BID' | 'ASK'>('ALL');

  const [layout, setLayout] = useState<LayoutConfig>(() => makeDefaultLayout());
  const [customizeOpen, setCustomizeOpen] = useState(false);

  useEffect(() => {
    const saved = safeParseLayout(localStorage.getItem(STORAGE_KEY));
    if (saved) setLayout(saved);
  }, []);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(layout));
  }, [layout]);

  const ofQs = new URLSearchParams({ symbol, exchange, window: String(windowSec) });
  const { data: orderflowRes } = useSWR(`/api/layer1/orderflow?${ofQs.toString()}`, fetcher, { refreshInterval: 3000 });

  const msQs = new URLSearchParams({
    symbol,
    window: String(Math.max(5, Math.min(600, windowSec))),
    depth: '50',
    whale_usdt: String(whaleUsdt),
  });
  const { data: microRes } = useSWR<MicrostructureRes>(`/api/layer1/microstructure?${msQs.toString()}`, fetcher, {
    refreshInterval: 3000,
  });

  const logsQs = new URLSearchParams({ symbol, limit: '30' });
  const { data: whaleLogsRes, mutate: mutateWhaleLogs } = useSWR<WhaleWallLogsRes>(
    whaleLogsOpen ? `/api/layer1/whale-walls?${logsQs.toString()}` : null,
    fetcher,
    { refreshInterval: whaleLogsOpen ? 6000 : 0 }
  );

  const orderflowOk = Boolean(orderflowRes?.success);
  const connected = orderflowOk;

  const orderflow: OrderflowData | null = orderflowOk ? orderflowRes?.data : null;

  const microOk = Boolean(microRes?.success);
  const micro = microOk ? microRes?.data : undefined;

  const dataDisconnected = !orderflowOk || !microOk;
  const dataDisconnectedText = useMemo(() => {
    if (!dataDisconnected) return '';
    const causes: string[] = [];
    if (!orderflowOk) causes.push('orderflow');
    if (!microOk) causes.push('microstructure');
    const causeText = causes.length ? ` (${causes.join(' + ')})` : '';
    return `Market data is currently unavailable${causeText}. If your region blocks exchange endpoints, try using a VPN or switching DNS (AdGuard DNS: dns.adguard.com, or Cloudflare DNS: 1.1.1.1).`;
  }, [dataDisconnected, orderflowOk, microOk]);

  const whaleLogsOk = Boolean(whaleLogsRes?.success);
  const whaleLogs = whaleLogsOk && Array.isArray(whaleLogsRes?.data?.logs) ? whaleLogsRes!.data!.logs! : [];
  const whaleLogsFiltered = useMemo(() => {
    if (whaleSideFilter === 'ALL') return whaleLogs;
    return whaleLogs.filter((l) => l.side === whaleSideFilter);
  }, [whaleLogs, whaleSideFilter]);

  const headerBanner = dataDisconnected ? (
    <div className="mb-4 rounded-lg border border-yellow-500/30 bg-yellow-500/10 px-4 py-3 text-sm text-yellow-200">
      <div className="font-semibold">Warning: data feed disconnected</div>
      <div className="mt-1 text-[13px] text-yellow-100/90">{dataDisconnectedText}</div>
    </div>
  ) : null;

  // Persist whale wall events to MongoDB (best-effort, client-driven to stay Vercel-safe)
  const [lastWhaleEventKey, setLastWhaleEventKey] = useState<string | null>(null);
  useEffect(() => {
    if (!microOk) return;
    const w = micro?.whale?.top_wall;
    const th = Number(micro?.whale?.threshold_usdt ?? whaleUsdt);
    if (!w || !Number.isFinite(w?.notional) || w.notional < th) return;

    const eventKey = `${symbol}:${w.side}:${Number(w.price).toFixed(4)}:${Math.floor(Date.now() / 10_000)}`;
    if (eventKey === lastWhaleEventKey) return;
    setLastWhaleEventKey(eventKey);

    fetch('/api/layer1/whale-walls', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        symbol,
        exchange: 'binance-futures',
        side: w.side,
        price: w.price,
        qty: w.qty,
        notional_usdt: w.notional,
        threshold_usdt: th,
      }),
    })
      .then(() => {
        // Refresh log list but don't block UI.
        mutateWhaleLogs();
      })
      .catch(() => {
        // ignore
      });
  }, [microOk, micro?.ts, micro?.whale?.top_wall?.notional, whaleUsdt, symbol, lastWhaleEventKey, mutateWhaleLogs]);

  // Running CVD (client-side) + rolling slopes (30s/60s)
  const [cvdRunning, setCvdRunning] = useState(0);
  const [cvdSamples, setCvdSamples] = useState<{ t: number; v: number }[]>([]);

  useEffect(() => {
    if (!microOk) return;
    const d = Number(micro?.cvd?.delta_base_qty ?? 0);
    if (!Number.isFinite(d)) return;

    setCvdRunning((prev) => {
      const next = prev + d;
      const now = Date.now();
      setCvdSamples((s) => {
        const merged = [...s, { t: now, v: next }];
        const cutoff = now - 70_000;
        return merged.filter((x) => x.t >= cutoff);
      });
      return next;
    });
  }, [microOk, micro?.ts]);

  function cvdSlope(seconds: number) {
    if (cvdSamples.length < 2) return null;
    const now = Date.now();
    const cutoff = now - seconds * 1000;
    const first = cvdSamples.find((x) => x.t >= cutoff) ?? cvdSamples[0];
    const last = cvdSamples[cvdSamples.length - 1];
    const dt = (last.t - first.t) / 1000;
    if (dt <= 0.5) return null;
    return (last.v - first.v) / dt;
  }

  const slope30 = cvdSlope(30);
  const slope60 = cvdSlope(60);

  // Liquidity shift tracker (client-side delta over ~5s)
  const [liqSamples, setLiqSamples] = useState<{ t: number; bid5: number; ask5: number }[]>([]);
  useEffect(() => {
    if (!microOk) return;
    const bid5 = Number(micro?.imbalance?.bid_sum_qty ?? 0);
    const ask5 = Number(micro?.imbalance?.ask_sum_qty ?? 0);
    if (!Number.isFinite(bid5) || !Number.isFinite(ask5)) return;
    const now = Date.now();
    setLiqSamples((s) => {
      const merged = [...s, { t: now, bid5, ask5 }];
      const cutoff = now - 20_000;
      return merged.filter((x) => x.t >= cutoff);
    });
  }, [microOk, micro?.ts]);

  const liqNow = liqSamples[liqSamples.length - 1];
  const liq5sAgo = liqSamples.find((x) => x.t >= Date.now() - 5_000) ?? liqSamples[0];
  const dBid5 = liqNow && liq5sAgo ? liqNow.bid5 - liq5sAgo.bid5 : null;
  const dAsk5 = liqNow && liq5sAgo ? liqNow.ask5 - liq5sAgo.ask5 : null;

  const buyVol = orderflowOk ? Number(orderflow?.aggr_buys?.volume ?? 0) : 0;
  const sellVol = orderflowOk ? Number(orderflow?.aggr_sells?.volume ?? 0) : 0;
  const totalVol = buyVol + sellVol;
  const buyShare = totalVol > 0 ? buyVol / totalVol : 0;
  const sellShare = totalVol > 0 ? sellVol / totalVol : 0;

  const panelsToShow = useMemo(() => layout.panels.slice(0, layout.panelCount), [layout]);
  const gridCols = layout.panelCount === 6 ? 'lg:grid-cols-3' : 'lg:grid-cols-2';

  const { data: symbolsRes } = useSWR<SymbolsRes>('/api/layer1/symbols', fetcher, {
    // Symbols list changes rarely.
    revalidateOnFocus: false,
    refreshInterval: 0,
  });

  const allPairs = useMemo(() => {
    const fromApi = symbolsRes?.success && Array.isArray(symbolsRes?.data?.symbols) ? symbolsRes!.data!.symbols! : [];
    // Bootstrap with common pairs so dropdown isn't empty if API is blocked.
    const merged = [...COMMON_FUTURES_PAIRS, ...fromApi];
    return Array.from(new Set(merged)).sort();
  }, [symbolsRes]);

  const headerSymbolOptions = useMemo(() => {
    const q = symbolQuery.trim().toUpperCase();
    const base = q ? allPairs.filter((s) => s.includes(q)) : allPairs;
    // Keep it light for render.
    return base.slice(0, 300);
  }, [allPairs, symbolQuery]);

  // Per-panel combobox filter state (keyed by panel id)
  const [pairQueryByPanel, setPairQueryByPanel] = useState<Record<string, string>>({});

  return (
    <div className="space-y-4">
  {headerBanner}
      {/* Symbol suggestions for all pair inputs (datalist UI support varies by browser/theme) */}
      <datalist id={SYMBOL_DATALIST_ID}>
  {allPairs.map((s) => (
          <option key={s} value={s} />
        ))}
      </datalist>

      <div className="bg-terminal-bg rounded-lg p-4 border border-terminal-border">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div>
            <div className="text-sm font-semibold text-terminal-accent">Terminal Layer 1</div>
            <div className="text-xs text-gray-500">Orderflow + multi-orderbook (refresh 1s)</div>
          </div>

          <div className="flex items-center gap-2">
            <ConnectedBadge ok={connected} />
            <button
              type="button"
              onClick={() => setCustomizeOpen(true)}
              className="text-xs px-3 py-2 rounded bg-terminal-accent text-black hover:bg-terminal-accent/80"
            >
              Customize Layout
            </button>
          </div>
        </div>

        <div className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-3">
          <div>
            <label className="block text-xs text-terminal-accent mb-1">Symbol</label>
            <div className="grid grid-cols-1 gap-2">
              <input
                value={symbolQuery}
                onChange={(e) => setSymbolQuery(e.target.value)}
                className="w-full px-3 py-2 bg-terminal-panel border border-terminal-border rounded text-terminal-accent text-sm"
                placeholder="Search symbol (e.g. BTC, KITE, USDT)"
              />

              <select
                value={symbol}
                onChange={(e) => {
                  const v = String(e.target.value || '').toUpperCase();
                  setSymbol(v);
                  setSymbolQuery('');
                }}
                className="w-full px-3 py-2 bg-terminal-panel border border-terminal-border rounded text-terminal-accent text-sm"
              >
                {!headerSymbolOptions.includes(symbol) ? <option value={symbol}>{symbol}</option> : null}
                {headerSymbolOptions.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>

              <div className="text-[11px] text-gray-500">Showing top {headerSymbolOptions.length} matches.</div>
            </div>
          </div>
          <div>
            <label className="block text-xs text-terminal-accent mb-1">Exchange</label>
            <input
              value={exchange}
              onChange={(e) => setExchange(e.target.value.toLowerCase())}
              className="w-full px-3 py-2 bg-terminal-panel border border-terminal-border rounded text-terminal-accent text-sm"
              placeholder="binance"
            />
          </div>
          <div>
            <label className="block text-xs text-terminal-accent mb-1">Window (sec)</label>
            <input
              type="number"
              min={1}
              max={3600}
              value={windowSec}
              onChange={(e) => setWindowSec(Math.max(1, Math.min(3600, Number(e.target.value) || 1)))}
              className="w-full px-3 py-2 bg-terminal-panel border border-terminal-border rounded text-terminal-accent text-sm"
            />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 md:grid-cols-5">
        <div className="bg-terminal-panel rounded-lg border border-terminal-border p-3">
          <div className="text-[11px] text-gray-500">Aggressive Buys</div>
          <div className="text-sm text-terminal-accent font-semibold">{orderflowOk ? fmtNum(orderflow?.aggr_buys?.volume, 4) : '—'}</div>
          <div className="text-[11px] text-gray-500">count: {orderflowOk ? fmtNum(orderflow?.aggr_buys?.count, 0) : '—'}</div>
          <div className="mt-2 h-2 w-full bg-terminal-bg/40 rounded overflow-hidden border border-terminal-border">
            <div className="h-full bg-green-500/70" style={{ width: orderflowOk ? pct(buyShare) : '0%' }} />
          </div>
          <div className="mt-1 text-[11px] text-gray-500">share: {orderflowOk ? fmtPct(buyShare) : '—'}</div>
        </div>
        <div className="bg-terminal-panel rounded-lg border border-terminal-border p-3">
          <div className="text-[11px] text-gray-500">Aggressive Sells</div>
          <div className="text-sm text-terminal-accent font-semibold">{orderflowOk ? fmtNum(orderflow?.aggr_sells?.volume, 4) : '—'}</div>
          <div className="text-[11px] text-gray-500">count: {orderflowOk ? fmtNum(orderflow?.aggr_sells?.count, 0) : '—'}</div>
          <div className="mt-2 h-2 w-full bg-terminal-bg/40 rounded overflow-hidden border border-terminal-border">
            <div className="h-full bg-red-500/70" style={{ width: orderflowOk ? pct(sellShare) : '0%' }} />
          </div>
          <div className="mt-1 text-[11px] text-gray-500">share: {orderflowOk ? fmtPct(sellShare) : '—'}</div>
        </div>
        <div className="bg-terminal-panel rounded-lg border border-terminal-border p-3">
          <div className="text-[11px] text-gray-500">Delta</div>
          <div className="text-sm text-terminal-accent font-semibold">{orderflowOk ? fmtNum(orderflow?.delta, 4) : '—'}</div>
        </div>
        <div className="bg-terminal-panel rounded-lg border border-terminal-border p-3">
          <div className="text-[11px] text-gray-500">Buy/Sell Ratio</div>
          <div className="text-sm text-terminal-accent font-semibold">{orderflowOk ? fmtNum(orderflow?.ratio, 4) : '—'}</div>
        </div>

        <div className="bg-terminal-panel rounded-lg border border-terminal-border p-3">
          <div className="text-[11px] text-gray-500">Long vs Short (proxy)</div>
          <div className="text-xs text-gray-400">Based on taker buy vs taker sell volume</div>
          <div className="mt-2 h-3 w-full bg-terminal-bg/40 rounded overflow-hidden border border-terminal-border flex">
            <div className="h-full bg-green-500/70" style={{ width: orderflowOk ? pct(buyShare) : '0%' }} />
            <div className="h-full bg-red-500/70" style={{ width: orderflowOk ? pct(sellShare) : '0%' }} />
          </div>
          <div className="mt-2 flex items-center justify-between text-[11px] text-gray-500">
            <div>Long pressure: {orderflowOk ? fmtPct(buyShare) : '—'}</div>
            <div>Short pressure: {orderflowOk ? fmtPct(sellShare) : '—'}</div>
          </div>
        </div>
      </div>

      <div className="bg-terminal-bg rounded-lg p-4 border border-terminal-border">
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <div>
            <div className="text-sm font-semibold text-terminal-accent">Microstructure</div>
            <div className="text-xs text-gray-500">CVD running • imbalance heatmap • absorption • liquidity shift • micro-vol • speed • whale wall</div>
          </div>
          <div className="flex items-center gap-2">
            <label className="text-[11px] text-gray-400">Whale (USDT)</label>
            <input
              type="number"
              min={1000}
              step={1000}
              value={whaleUsdt}
              onChange={(e) => setWhaleUsdt(Math.max(1000, Number(e.target.value) || 1000))}
              className="w-[140px] px-3 py-2 bg-terminal-panel border border-terminal-border rounded text-terminal-accent text-sm"
            />
            <span className={`text-[11px] px-2 py-1 rounded border ${microOk ? 'text-green-300 border-green-500/30 bg-green-500/10' : 'text-terminal-danger border-terminal-danger/30 bg-red-500/10'}`}>
              {microOk ? 'Live' : 'Off'}
            </span>
          </div>
        </div>

        <div className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-3 lg:grid-cols-6">
          <div className="bg-terminal-panel rounded-lg border border-terminal-border p-3">
            <div className="text-[11px] text-gray-500">CVD (running)</div>
            <div className="text-sm text-terminal-accent font-semibold">{microOk ? fmtNum(cvdRunning, 4) : '—'}</div>
            <div className="text-[11px] text-gray-500">Δ({micro?.window_sec ?? windowSec}s): {microOk ? fmtNum(micro?.cvd?.delta_base_qty, 4) : '—'}</div>
          </div>

          <div className="bg-terminal-panel rounded-lg border border-terminal-border p-3">
            <div className="text-[11px] text-gray-500">CVD slope</div>
            <div className="text-sm text-terminal-accent font-semibold">30s: {microOk ? fmtNum(slope30, 4) : '—'}</div>
            <div className="text-[11px] text-gray-500">60s: {microOk ? fmtNum(slope60, 4) : '—'}</div>
          </div>

          <div className="bg-terminal-panel rounded-lg border border-terminal-border p-3">
            <div className="text-[11px] text-gray-500">Imbalance (top5)</div>
            <div className="text-sm text-terminal-accent font-semibold">
              {microOk ? (micro?.imbalance?.ratio == null ? '—' : fmtNum(micro?.imbalance?.ratio, 2)) : '—'}
              {microOk && micro?.imbalance?.flag_gt_3_to_1 ? <span className="ml-2 text-[11px] text-terminal-danger">&gt;3:1</span> : null}
            </div>
            <div className="text-[11px] text-gray-500">side: {microOk ? (micro?.imbalance?.side ?? '—') : '—'}</div>
          </div>

          <div className="bg-terminal-panel rounded-lg border border-terminal-border p-3">
            <div className="text-[11px] text-gray-500">Liquidity shift (≈5s)</div>
            <div className="text-sm text-terminal-accent font-semibold">ΔBid: {microOk ? fmtNum(dBid5, 2) : '—'}</div>
            <div className="text-[11px] text-gray-500">ΔAsk: {microOk ? fmtNum(dAsk5, 2) : '—'}</div>
          </div>

          <div className="bg-terminal-panel rounded-lg border border-terminal-border p-3">
            <div className="text-[11px] text-gray-500">Micro-vol meter</div>
            <div className="text-sm text-terminal-accent font-semibold">{microOk ? (micro?.meters?.micro_vol ?? '—') : '—'}</div>
            <div className="text-[11px] text-gray-500">RV(1m): {microOk ? fmtNum(micro?.micro_volatility?.realized_vol_1m, 6) : '—'}</div>
          </div>

          <div className="bg-terminal-panel rounded-lg border border-terminal-border p-3">
            <div className="text-[11px] text-gray-500">Trade speed</div>
            <div className="text-sm text-terminal-accent font-semibold">{microOk ? fmtNum(micro?.trade_flow_speed?.trades_per_sec, 2) : '—'} t/s</div>
            <div className="text-[11px] text-gray-500">aggr/s: {microOk ? fmtNum(micro?.trade_flow_speed?.aggr_base_qty_per_sec, 4) : '—'}</div>
          </div>
        </div>

        <div className="mt-3 grid grid-cols-1 gap-3 md:grid-cols-2">
          <div className="bg-terminal-panel rounded-lg border border-terminal-border p-3">
            <div className="flex items-center justify-between">
              <div className="text-[11px] text-gray-500">Imbalance heatmap (level 1..5)</div>
              <div className="text-[11px] text-gray-500">spread: {microOk ? fmtNum(micro?.micro_volatility?.spread, 4) : '—'} ({microOk ? (micro?.meters?.spread ?? '—') : '—'})</div>
            </div>
            <div className="mt-2 space-y-2">
              {(micro?.imbalance?.heatmap ?? []).length ? (
                (micro!.imbalance!.heatmap!).map((h) => {
                  const r = h.ratio;
                  const ratioAbs = r == null ? null : r >= 1 ? r : 1 / (r || 1);
                  const side = r == null ? null : r >= 1 ? 'BID' : 'ASK';
                  const intensity = ratioAbs == null ? 0 : clamp01(Math.log10(Math.min(1000, ratioAbs)) / Math.log10(10));
                  const bg = side === 'BID' ? 'bg-green-500/50' : 'bg-red-500/50';
                  return (
                    <div key={h.level}>
                      <div className="flex items-center justify-between text-[11px] text-gray-500">
                        <div>L{h.level}</div>
                        <div>
                          {side ?? '—'} {r == null ? '—' : fmtNum(r, 2)}
                        </div>
                      </div>
                      <div className="mt-1 h-2 w-full bg-terminal-bg/40 rounded overflow-hidden border border-terminal-border">
                        <div className={`h-full ${bg}`} style={{ width: pct(intensity) }} />
                      </div>
                    </div>
                  );
                })
              ) : (
                <div className="text-xs text-gray-500">—</div>
              )}
            </div>
          </div>

          <div className="bg-terminal-panel rounded-lg border border-terminal-border p-3">
            <div className="text-[11px] text-gray-500">Alerts</div>
            <div className="mt-2 grid grid-cols-1 gap-2">
              <div className={`rounded border px-3 py-2 text-xs ${microOk && micro?.alerts?.buy_absorption_detected ? 'border-yellow-500/40 bg-yellow-500/10 text-yellow-200' : 'border-terminal-border bg-terminal-bg/40 text-gray-400'}`}>
                Buy absorption: {microOk ? (micro?.alerts?.buy_absorption_detected ? 'Detected' : '—') : '—'}
              </div>
              <div className={`rounded border px-3 py-2 text-xs ${microOk && micro?.alerts?.sell_absorption_detected ? 'border-yellow-500/40 bg-yellow-500/10 text-yellow-200' : 'border-terminal-border bg-terminal-bg/40 text-gray-400'}`}>
                Sell absorption: {microOk ? (micro?.alerts?.sell_absorption_detected ? 'Detected' : '—') : '—'}
              </div>
              <div className="rounded border border-terminal-border bg-terminal-bg/40 px-3 py-2 text-xs text-gray-400">
                Whale wall: {microOk && micro?.whale?.top_wall ? `${micro.whale.top_wall.side} ~${fmtNum(micro.whale.top_wall.notional, 0)} USDT @ ${fmtNum(micro.whale.top_wall.price, 4)}` : '—'}
              </div>
            </div>
          </div>
        </div>

        <div className="mt-3 bg-terminal-panel rounded-lg border border-terminal-border p-3">
          <div className="flex items-center justify-between">
            <div className="text-[11px] text-gray-500">Whale wall logs (MongoDB)</div>
            <div className="flex items-center gap-2">
              <select
                value={whaleSideFilter}
                onChange={(e) => setWhaleSideFilter(e.target.value as any)}
                className="text-[11px] px-2 py-1 rounded border border-terminal-border bg-terminal-bg text-gray-200"
                title="Filter side"
              >
                <option value="ALL">All</option>
                <option value="BID">BID</option>
                <option value="ASK">ASK</option>
              </select>

              <button
                type="button"
                onClick={async () => {
                  try {
                    await fetch(`/api/layer1/whale-walls?symbol=${encodeURIComponent(symbol)}`, { method: 'DELETE' });
                  } finally {
                    mutateWhaleLogs();
                  }
                }}
                className="text-[11px] px-2 py-1 rounded border border-terminal-border text-gray-300 hover:text-terminal-accent hover:border-terminal-accent"
                title="Delete logs for current symbol"
              >
                Clear
              </button>

              <button
                type="button"
                onClick={() => setWhaleLogsOpen((v) => !v)}
                className="text-[11px] px-2 py-1 rounded border border-terminal-border text-gray-300 hover:text-terminal-accent hover:border-terminal-accent"
              >
                {whaleLogsOpen ? 'Hide' : 'Show'}
              </button>
            </div>
          </div>

          {whaleLogsOpen ? (
            <div className="mt-2">
              {!whaleLogsOk ? (
                <div className="text-xs text-gray-500">No DB connection / not loaded yet.</div>
              ) : whaleLogsFiltered.length ? (
                <div className="max-h-[220px] overflow-y-auto border border-terminal-border rounded">
                  <table className="w-full text-xs">
                    <thead className="sticky top-0 bg-terminal-bg">
                      <tr className="text-gray-500">
                        <th className="text-left font-medium px-2 py-2">Time</th>
                        <th className="text-left font-medium px-2 py-2">Side</th>
                        <th className="text-left font-medium px-2 py-2">Price</th>
                        <th className="text-left font-medium px-2 py-2">Notional</th>
                        <th className="text-left font-medium px-2 py-2">Symbol</th>
                      </tr>
                    </thead>
                    <tbody>
                      {whaleLogsFiltered.map((l, i) => (
                        <tr key={l._id ?? `${l.created_at}-${i}`} className="border-t border-terminal-border">
                          <td className="px-2 py-2 text-gray-400 whitespace-nowrap">
                            {l.created_at ? new Date(l.created_at).toLocaleTimeString() : '—'}
                          </td>
                          <td className={`px-2 py-2 font-semibold ${l.side === 'BID' ? 'text-green-300' : 'text-red-300'}`}>{l.side}</td>
                          <td className="px-2 py-2 text-gray-200">{fmtNum(l.price, 4)}</td>
                          <td className="px-2 py-2 text-gray-200">{fmtNum(l.notional_usdt, 0)} USDT</td>
                          <td className="px-2 py-2 text-terminal-accent">{l.symbol}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="text-xs text-gray-500">No logs yet (waiting for a wall &gt; threshold).</div>
              )}
            </div>
          ) : null}
        </div>
      </div>

  <PriceTickerRow panels={panelsToShow} />

      <div className={`grid grid-cols-1 gap-4 ${gridCols}`}>
        {panelsToShow.map((p) => (
          <OrderbookPanel key={p.id} panel={p} />
        ))}
      </div>

      {customizeOpen ? (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
          <div className="bg-terminal-bg border border-terminal-border rounded-lg w-full max-w-3xl max-h-[90vh] overflow-y-auto">
            <div className="p-4 border-b border-terminal-border flex items-center justify-between">
              <div className="text-sm font-semibold text-terminal-accent">Customize Orderbook Layout</div>
              <button
                type="button"
                onClick={() => setCustomizeOpen(false)}
                className="text-xs px-3 py-2 rounded border border-terminal-border text-gray-300 hover:text-terminal-accent hover:border-terminal-accent"
              >
                Close
              </button>
            </div>

            <div className="p-4 space-y-4">
              <div className="flex items-center gap-2">
                <div className="text-xs text-gray-400">Panels:</div>
                <button
                  type="button"
                  onClick={() => setLayout((prev) => ({ ...prev, panelCount: 6 }))}
                  className={`text-xs px-3 py-2 rounded border ${layout.panelCount === 6 ? 'border-terminal-accent text-terminal-accent' : 'border-terminal-border text-gray-300'}`}
                >
                  6 (2x3)
                </button>
                <button
                  type="button"
                  onClick={() => setLayout((prev) => ({ ...prev, panelCount: 4 }))}
                  className={`text-xs px-3 py-2 rounded border ${layout.panelCount === 4 ? 'border-terminal-accent text-terminal-accent' : 'border-terminal-border text-gray-300'}`}
                >
                  4 (2x2)
                </button>
              </div>

              <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                {layout.panels.slice(0, layout.panelCount).map((p, idx) => (
                  <div key={p.id} className="bg-terminal-panel rounded border border-terminal-border p-3">
                    <div className="text-xs text-terminal-accent font-semibold mb-2">Panel {idx + 1}</div>
                    <div className="grid grid-cols-1 gap-2">
                      <div>
                        {(() => {
                          const panelListId = `${SYMBOL_DATALIST_ID}-${p.id}`;
                          const q = (pairQueryByPanel[p.id] ?? '').trim().toUpperCase();
                          const options = q ? allPairs.filter((s) => s.includes(q)).slice(0, 200) : allPairs.slice(0, 200);

                          return (
                            <div>
                              <label className="block text-[11px] text-gray-500 mb-1">Pair</label>

                              <div className="grid grid-cols-1 gap-2">
                                {/* Search box (controls what shows in the dropdown list) */}
                                <input
                                  value={pairQueryByPanel[p.id] ?? ''}
                                  onChange={(e) => {
                                    const v = e.target.value;
                                    setPairQueryByPanel((prev) => ({ ...prev, [p.id]: v }));
                                  }}
                                  className="w-full px-3 py-2 bg-terminal-bg border border-terminal-border rounded text-terminal-accent text-sm"
                                  placeholder="Search pair (e.g. BTC, KITE, USDT)"
                                />

                                {/* Dropdown-like (native) picker */}
                                <select
                                  value={p.symbol}
                                  onChange={(e) => {
                                    const v = String(e.target.value || '').toUpperCase();
                                    if (!v) return;
                                    setLayout((prev) => {
                                      const panels = [...prev.panels];
                                      panels[idx] = { ...panels[idx], symbol: v };
                                      return { ...prev, panels };
                                    });
                                  }}
                                  className="w-full px-3 py-2 bg-terminal-bg border border-terminal-border rounded text-terminal-accent text-sm"
                                >
                                  {/* Keep current value visible even if filtered list doesn't include it */}
                                  {!options.includes(p.symbol) ? <option value={p.symbol}>{p.symbol}</option> : null}
                                  {options.map((s) => (
                                    <option key={s} value={s}>
                                      {s}
                                    </option>
                                  ))}
                                </select>

                                {!symbolsRes?.success ? (
                                  <div className="text-[11px] text-gray-500">
                                    Pair list fallback mode (Binance symbols API not reachable). Showing common pairs only.
                                  </div>
                                ) : (
                                  <div className="text-[11px] text-gray-500">Showing top {options.length} matches.</div>
                                )}
                              </div>
                            </div>
                          );
                        })()}
                      </div>
                      <input
                        value={p.exchange}
                        onChange={(e) => {
                          const v = e.target.value.toLowerCase();
                          setLayout((prev) => {
                            const panels = [...prev.panels];
                            panels[idx] = { ...panels[idx], exchange: v };
                            return { ...prev, panels };
                          });
                        }}
                        className="w-full px-3 py-2 bg-terminal-bg border border-terminal-border rounded text-terminal-accent text-sm"
                        placeholder="binance"
                      />
                      <select
                        value={p.depth}
                        onChange={(e) => {
                          const v = Number(e.target.value) as 10 | 25 | 50 | 100;
                          setLayout((prev) => {
                            const panels = [...prev.panels];
                            panels[idx] = { ...panels[idx], depth: v };
                            return { ...prev, panels };
                          });
                        }}
                        className="w-full px-3 py-2 bg-terminal-bg border border-terminal-border rounded text-terminal-accent text-sm"
                      >
                        <option value={10}>Depth 10</option>
                        <option value={25}>Depth 25</option>
                        <option value={50}>Depth 50</option>
                        <option value={100}>Depth 100</option>
                      </select>
                    </div>
                  </div>
                ))}
              </div>

              <div className="flex items-center justify-between">
                <button
                  type="button"
                  onClick={() => setLayout(makeDefaultLayout())}
                  className="text-xs px-3 py-2 rounded border border-terminal-border text-gray-300 hover:text-terminal-accent hover:border-terminal-accent"
                >
                  Reset default
                </button>
                <button
                  type="button"
                  onClick={() => setCustomizeOpen(false)}
                  className="text-xs px-3 py-2 rounded bg-terminal-accent text-black hover:bg-terminal-accent/80"
                >
                  Save
                </button>
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
