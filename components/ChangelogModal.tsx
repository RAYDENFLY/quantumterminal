'use client';

import React, { useEffect, useMemo, useState } from 'react';

type ChangelogItem = {
  sha: string;
  shortSha: string;
  url: string;
  title: string;
  body: string | null;
  author: string;
  date: string | null;
};

type ChangelogResponse =
  | { success: true; items: ChangelogItem[] }
  | { success: false; error: string; details?: string };

function formatDate(iso: string | null) {
  if (!iso) return '';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleString(undefined, {
    year: 'numeric',
    month: 'short',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export default function ChangelogModal({
  open,
  onClose,
  limit = 20,
}: {
  open: boolean;
  onClose: () => void;
  limit?: number;
}) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [items, setItems] = useState<ChangelogItem[]>([]);

  const url = useMemo(() => `/api/changelog?limit=${limit}`, [limit]);

  useEffect(() => {
    if (!open) return;

    let cancelled = false;
    setLoading(true);
    setError(null);

    fetch(url)
      .then((r) => r.json() as Promise<ChangelogResponse>)
      .then((json) => {
        if (cancelled) return;
        if (!json.success) {
          setError(json.error || 'Failed to load changelog');
          setItems([]);
          return;
        }
        setItems(json.items);
      })
      .catch((e) => {
        if (cancelled) return;
        setError(e?.message ?? 'Failed to load changelog');
        setItems([]);
      })
      .finally(() => {
        if (cancelled) return;
        setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [open, url]);

  useEffect(() => {
    if (!open) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 p-4"
      role="dialog"
      aria-modal="true"
      aria-label="Changelog"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="w-full max-w-3xl rounded-xl border border-[#334155] bg-[#0b1020] shadow-2xl">
        <div className="flex items-center justify-between border-b border-[#24314d] px-4 py-3">
          <div>
            <div className="text-sm font-semibold text-white">Changelog</div>
            <div className="text-xs text-slate-300">Latest commits from main branch</div>
          </div>
          <button
            onClick={onClose}
            className="rounded-md border border-[#334155] bg-[#111b33] px-3 py-1.5 text-xs text-slate-200 hover:bg-[#16244a]"
          >
            Close
          </button>
        </div>

        <div className="max-h-[70vh] overflow-auto px-4 py-3">
          {loading ? (
            <div className="py-10 text-center text-sm text-slate-300">Loading…</div>
          ) : error ? (
            <div className="py-10 text-center text-sm text-red-300">{error}</div>
          ) : items.length === 0 ? (
            <div className="py-10 text-center text-sm text-slate-300">No commits found.</div>
          ) : (
            <ul className="space-y-3">
              {items.map((c) => (
                <li key={c.sha} className="rounded-lg border border-[#24314d] bg-[#0f1730] p-3">
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <div className="min-w-0">
                      <div className="truncate text-sm font-semibold text-white">{c.title}</div>
                      <div className="mt-1 text-xs text-slate-300">
                        {c.author}
                        {c.date ? ` • ${formatDate(c.date)}` : ''}
                      </div>
                    </div>

                    <a
                      href={c.url}
                      target="_blank"
                      rel="noreferrer"
                      className="shrink-0 rounded-md border border-[#334155] bg-[#111b33] px-2 py-1 text-xs text-slate-200 hover:bg-[#16244a]"
                      title={c.sha}
                    >
                      {c.shortSha}
                    </a>
                  </div>

                  {c.body ? (
                    <pre className="mt-2 whitespace-pre-wrap break-words rounded-md bg-black/30 p-2 text-xs text-slate-200">
                      {c.body}
                    </pre>
                  ) : null}
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}
