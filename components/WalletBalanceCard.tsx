'use client';

import { useEffect, useState } from 'react';

type BalanceResponse =
  | {
      success: true;
      data: {
        balance?: string;
        symbol?: string;
        address?: string;
        network?: string;
      };
    }
  | {
      success: false;
      error?: string;
      hint?: string;
    };

export default function WalletBalanceCard() {
  const [loading, setLoading] = useState(true);
  const [res, setRes] = useState<BalanceResponse | null>(null);

  useEffect(() => {
    let cancelled = false;
    const controller = new AbortController();
    const t = setTimeout(() => controller.abort(), 8000);

    (async () => {
      try {
        const r = await fetch('/api/wallet-balance', {
          signal: controller.signal,
          cache: 'no-store',
        });
        const json = (await r.json()) as BalanceResponse;
        if (!cancelled) setRes(json);
      } catch (e) {
        if (!cancelled)
          setRes({
            success: false,
            error: 'Failed to load wallet balance.',
            hint: 'Coba refresh, atau cek konfigurasi RPC di Vercel env.',
          });
      } finally {
        if (!cancelled) setLoading(false);
        clearTimeout(t);
      }
    })();

    return () => {
      cancelled = true;
      clearTimeout(t);
      controller.abort();
    };
  }, []);

  return (
    <div className="mt-3 rounded-md border border-terminal-border bg-terminal-bg p-3 text-sm">
      <div className="text-xs text-gray-400">Saldo saat ini (BNB)</div>

      {loading ? (
        <div className="mt-1 text-xs text-gray-400">Loading…</div>
      ) : res?.success ? (
        <div className="mt-1 font-mono text-gray-200">
          {res.data?.balance ?? '-'} {res.data?.symbol ?? 'BNB'}
        </div>
      ) : (
        <div className="mt-1 text-xs text-gray-400">
          Tidak bisa ambil saldo otomatis.
          <div className="mt-1">
            <span className="text-gray-500">Error:</span>{' '}
            <span className="break-words font-mono">{res?.error ?? '-'}</span>
          </div>
          <div className="mt-1">
            <span className="text-gray-500">Hint:</span>{' '}
            <span className="break-words">{res?.hint ?? 'Set BSC_RPC_URL di env.'}</span>
          </div>
        </div>
      )}
    </div>
  );
}
