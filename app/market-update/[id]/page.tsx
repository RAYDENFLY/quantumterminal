'use client';

import Link from 'next/link';
import useSWR from 'swr';
import { useMemo, useState } from 'react';
import TopBar from '@/components/TopBar';
import SiteFooter from '@/components/SiteFooter';
import { usePathname } from 'next/navigation';

const fetcher = (url: string) => fetch(url).then((r) => r.json());

export default function MarketUpdateDetailPage() {
  const pathname = usePathname();
  const id = useMemo(() => {
    // pathname: /market-update/<id>
    const parts = String(pathname || '').split('/').filter(Boolean);
    return parts[0] === 'market-update' && parts[1] ? parts[1] : '';
  }, [pathname]);

  const { data } = useSWR(id ? `/api/market-update?id=${encodeURIComponent(id)}` : null, fetcher);
  const update = data?.success ? data.data : null;
  const [zoomOpen, setZoomOpen] = useState(false);
  const [zoom, setZoom] = useState(1);
  const zoomedSrc = useMemo(() => (update?.imageUrl ? String(update.imageUrl) : ''), [update?.imageUrl]);

  return (
    <div className="min-h-screen flex flex-col">
      <TopBar activeModule="market" setActiveModule={() => {}} />

      <main className="flex-1">
        <div className="mx-auto max-w-3xl px-4 py-8 text-terminal-text">
          <div className="flex items-center justify-between">
            <Link href="/?module=market" className="text-sm text-gray-400 hover:text-terminal-accent">
              {'< Back'}
            </Link>
            <Link href="/" className="text-sm text-terminal-accent hover:underline">
              Home
            </Link>
          </div>

          {!update ? (
            <div className="mt-6 rounded-xl border border-terminal-border bg-terminal-panel p-4 text-sm text-gray-400">
              Loading...
            </div>
          ) : (
            <div className="mt-6 rounded-xl border border-terminal-border bg-terminal-panel p-5">
              <div className="text-xs text-gray-400">
                <span className="text-terminal-accent">Market update</span>
                <span className="mx-2">•</span>
                <span>{update.author}</span>
                <span className="mx-2">•</span>
                <span>{update.createdAt ? new Date(update.createdAt).toLocaleString() : ''}</span>
              </div>

              <h1 className="mt-2 text-xl font-bold text-terminal-accent">{update.title}</h1>

              {update.imageUrl ? (
                <div className="mt-4 overflow-hidden rounded-lg border border-terminal-border bg-terminal-bg">
                  <button
                    type="button"
                    onClick={() => {
                      setZoom(1);
                      setZoomOpen(true);
                    }}
                    className="block w-full"
                    title="Click to zoom"
                  >
                    <img src={update.imageUrl} alt={update.title} className="w-full max-h-[520px] object-contain" />
                  </button>
                </div>
              ) : null}

              <div className="mt-4 whitespace-pre-wrap text-sm text-gray-200">{update.content}</div>
            </div>
          )}
        </div>
      </main>

      <SiteFooter />

      {zoomOpen && zoomedSrc ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4" onClick={() => setZoomOpen(false)}>
          <div
            className="relative w-full max-w-5xl rounded-lg border border-terminal-border bg-terminal-bg p-3"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mb-2 flex items-center justify-between">
              <div className="text-xs text-gray-400">Image zoom</div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  className="rounded-md border border-terminal-border px-2 py-1 text-xs text-gray-200 hover:border-terminal-accent hover:text-terminal-accent"
                  onClick={() => setZoom((z) => Math.max(0.5, Math.round((z - 0.25) * 100) / 100))}
                >
                  −
                </button>
                <div className="text-xs text-gray-300 w-12 text-center">{Math.round(zoom * 100)}%</div>
                <button
                  type="button"
                  className="rounded-md border border-terminal-border px-2 py-1 text-xs text-gray-200 hover:border-terminal-accent hover:text-terminal-accent"
                  onClick={() => setZoom((z) => Math.min(3, Math.round((z + 0.25) * 100) / 100))}
                >
                  +
                </button>
                <button
                  type="button"
                  className="rounded-md border border-terminal-border px-2 py-1 text-xs text-gray-200 hover:border-terminal-accent hover:text-terminal-accent"
                  onClick={() => setZoomOpen(false)}
                >
                  Close
                </button>
              </div>
            </div>

            <div className="max-h-[80vh] overflow-auto rounded-md border border-terminal-border bg-black">
              <img
                src={zoomedSrc}
                alt="Zoomed market update"
                style={{ transform: `scale(${zoom})`, transformOrigin: 'top left' }}
                className="block h-auto w-auto"
              />
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
