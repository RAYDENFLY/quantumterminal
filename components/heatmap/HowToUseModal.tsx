'use client';

import { useEffect, useRef } from 'react';

type Props = {
  open: boolean;
  onClose: () => void;
};

const SECTIONS = [
  {
    icon: '🔍',
    titleEN: 'Selecting a Symbol',
    titleID: 'Memilih Symbol',
    bodyEN:
      'Type a trading pair (e.g. BTCUSDT, ETHUSDT) in the input box and press Load or hit Enter. You can pick from the dropdown of common pairs.',
    bodyID:
      'Ketik pasangan trading (contoh: BTCUSDT, ETHUSDT) di kotak input, lalu tekan Load atau Enter. Kamu juga bisa pilih dari dropdown pasangan umum.',
  },
  {
    icon: '⚡',
    titleEN: 'Live Mode (WebSocket)',
    titleID: 'Mode Live (WebSocket)',
    bodyEN:
      'Click the LIVE button to toggle real-time orderbook updates via WebSocket. When connected, the button shows ● LIVE (futures) or ● LIVE (spot) — the app auto-falls back from Binance Futures stream to Spot stream if the primary fails.',
    bodyID:
      'Klik tombol LIVE untuk mengaktifkan update orderbook real-time via WebSocket. Saat tersambung, tombol menampilkan ● LIVE (futures) atau ● LIVE (spot) — app otomatis fallback dari stream Futures ke Spot jika koneksi utama gagal.',
  },
  {
    icon: '🗺️',
    titleEN: 'Reading the Heatmap',
    titleID: 'Membaca Heatmap',
    bodyEN:
      'Each row is a price level. Color intensity shows notional size — darker green = heavier bid, darker red = heavier ask. The WALL badge marks levels with notional ≥2.5× the average of the top-20 levels.',
    bodyID:
      'Setiap baris adalah satu level harga. Intensitas warna menunjukkan ukuran notional — hijau gelap = bid tebal, merah gelap = ask tebal. Badge WALL menandai level dengan notional ≥2.5× rata-rata top-20 level.',
  },
  {
    icon: '📊',
    titleEN: 'Cumulative Depth Chart',
    titleID: 'Chart Kedalaman Kumulatif',
    bodyEN:
      'The canvas chart below the heatmap shows cumulative bid (green) and ask (red) depth curves. Wall markers are shown as dashed vertical lines. The yellow dashed line is the mid price.',
    bodyID:
      'Chart canvas di bawah heatmap menampilkan kurva kedalaman kumulatif bid (hijau) dan ask (merah). Marker wall ditampilkan sebagai garis vertikal putus-putus. Garis kuning putus-putus adalah harga mid.',
  },
  {
    icon: '🧱',
    titleEN: 'Support / Resistance Zones',
    titleID: 'Zona Support / Resistance',
    bodyEN:
      'Walls within 0.2% of each other are grouped into a zone. Support zones come from bid walls below mid; resistance zones come from ask walls above mid. Distance from mid is shown in %.',
    bodyID:
      'Wall yang berjarak ≤0.2% satu sama lain dikelompokkan jadi satu zona. Zona support berasal dari bid wall di bawah mid; zona resistance dari ask wall di atas mid. Jarak dari mid ditampilkan dalam %.',
  },
  {
    icon: '🚀',
    titleEN: 'Orderbook Velocity',
    titleID: 'Kecepatan Orderbook',
    bodyEN:
      'Tracks % change in total bid and ask notional over a ~10-second rolling window. "Bid Additions" means buy-side liquidity is growing; "Ask Removing" means sellers are pulling their orders — often a precursor to a price move.',
    bodyID:
      'Melacak % perubahan total notional bid dan ask dalam jendela rolling ~10 detik. "Bid Additions" artinya likuiditas sisi beli bertambah; "Ask Removing" artinya seller menarik order — seringkali pertanda pergerakan harga.',
  },
  {
    icon: '📦',
    titleEN: 'Volume Distribution',
    titleID: 'Distribusi Volume',
    bodyEN:
      'Bar chart of notional per price level across the full spread. Brighter bars (≥40% of peak) indicate wall-level concentration. Left = bids, right = asks, yellow dashed = mid.',
    bodyID:
      'Bar chart notional per level harga di seluruh spread. Bar lebih terang (≥40% puncak) menandai konsentrasi setingkat wall. Kiri = bid, kanan = ask, kuning putus-putus = mid.',
  },
  {
    icon: '⚖️',
    titleEN: 'OB Imbalance & Short-Term Bias',
    titleID: 'Imbalance OB & Bias Jangka Pendek',
    bodyEN:
      'OB Imbalance shows the bid/ask volume ratio. Short-Term Bias is a composite score (−4 to +4) from 4 signals: OB imbalance, market pressure, taker flow, and nearby walls. It is an indicator, not financial advice.',
    bodyID:
      'OB Imbalance menampilkan rasio volume bid/ask. Short-Term Bias adalah skor komposit (−4 hingga +4) dari 4 sinyal: imbalance OB, tekanan pasar, aliran taker, dan wall terdekat. Ini indikator, bukan saran keuangan.',
  },
  {
    icon: '🚨',
    titleEN: 'Spoofing Warning',
    titleID: 'Peringatan Spoofing',
    bodyEN:
      'Alerts when a large wall (≥$50K notional) drops by ≥70% within 5 seconds. This may indicate spoofing — fake orders placed to manipulate price perception. Alerts expire after 30 seconds.',
    bodyID:
      'Memperingatkan ketika wall besar (notional ≥$50K) turun ≥70% dalam 5 detik. Ini bisa menandakan spoofing — order palsu yang dipasang untuk memanipulasi persepsi harga. Alert otomatis hilang setelah 30 detik.',
  },
  {
    icon: '🌐',
    titleEN: 'Connection Issues / VPN',
    titleID: 'Masalah Koneksi / VPN',
    bodyEN:
      'If data fails to load, your server region may be blocking Binance endpoints. On Vercel, using a VPN on your device won\'t help — the request comes from the server. Try deploying in a different region or routing through a proxy. Suggested DNS: AdGuard (dns.adguard.com) or Cloudflare (1.1.1.1).',
    bodyID:
      'Jika data gagal dimuat, region server kamu mungkin memblokir endpoint Binance. Di Vercel, VPN di perangkatmu tidak membantu — request berasal dari server. Coba deploy di region lain atau routing lewat proxy. DNS yang disarankan: AdGuard (dns.adguard.com) atau Cloudflare (1.1.1.1).',
  },
];

export default function HowToUseModal({ open, onClose }: Props) {
  const overlayRef = useRef<HTMLDivElement>(null);

  // Close on Escape
  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [open, onClose]);

  // Lock body scroll
  useEffect(() => {
    if (open) document.body.style.overflow = 'hidden';
    else document.body.style.overflow = '';
    return () => { document.body.style.overflow = ''; };
  }, [open]);

  if (!open) return null;

  return (
    <div
      ref={overlayRef}
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: 'rgba(0,0,0,0.72)', backdropFilter: 'blur(4px)' }}
      onClick={(e) => { if (e.target === overlayRef.current) onClose(); }}
    >
      <div
        className="relative w-full max-w-2xl max-h-[90vh] flex flex-col rounded-xl border border-terminal-border overflow-hidden"
        style={{ background: '#0f1117' }}
      >
        {/* ── Header ── */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-terminal-border shrink-0">
          <div>
            <div className="text-sm font-bold text-terminal-accent">How to Use — Cara Penggunaan</div>
            <div className="text-[11px] text-gray-500 mt-0.5">Orderbook Liquidity Heatmap · QuantumTerminal</div>
          </div>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-200 text-lg leading-none transition-colors w-7 h-7 flex items-center justify-center rounded hover:bg-white/10"
            aria-label="Close"
          >
            ✕
          </button>
        </div>

        {/* ── Body ── */}
        <div className="overflow-y-auto px-5 py-4 space-y-5">
          {SECTIONS.map((s, i) => (
            <div key={i} className="border border-white/6 rounded-lg p-4 space-y-2">
              {/* title row */}
              <div className="flex items-center gap-2">
                <span className="text-base leading-none">{s.icon}</span>
                <div>
                  <span className="text-[12px] font-semibold text-terminal-accent">{s.titleEN}</span>
                  <span className="text-[11px] text-gray-500 ml-1.5">/ {s.titleID}</span>
                </div>
              </div>

              {/* EN */}
              <div className="flex gap-2">
                <span className="shrink-0 text-[9px] font-bold text-sky-500/70 bg-sky-500/10 border border-sky-500/20 rounded px-1 py-0.5 h-fit mt-0.5">EN</span>
                <p className="text-[12px] text-gray-300 leading-relaxed">{s.bodyEN}</p>
              </div>

              {/* ID */}
              <div className="flex gap-2">
                <span className="shrink-0 text-[9px] font-bold text-emerald-500/70 bg-emerald-500/10 border border-emerald-500/20 rounded px-1 py-0.5 h-fit mt-0.5">ID</span>
                <p className="text-[12px] text-gray-400 leading-relaxed">{s.bodyID}</p>
              </div>
            </div>
          ))}

          {/* footer note */}
          <div className="text-[10px] text-gray-600 text-center pb-2">
            All signals are informational only. Not financial advice. / Semua sinyal hanya untuk informasi. Bukan saran keuangan.
          </div>
        </div>
      </div>
    </div>
  );
}
