'use client';

import { useMemo, useState } from 'react';
import useSWR from 'swr';
import Link from 'next/link';

const fetcher = (url: string) => fetch(url).then((r) => r.json());

export default function AdminReportsPage() {
  const [status, setStatus] = useState<'open' | 'reviewed' | 'dismissed' | 'all'>('open');
  const [page, setPage] = useState(1);

  const url = useMemo(() => {
    const sp = new URLSearchParams();
    sp.set('page', String(page));
    sp.set('limit', '20');
    if (status !== 'all') sp.set('status', status);
    return `/api/admin/reports?${sp.toString()}`;
  }, [status, page]);

  const { data, error, mutate, isLoading } = useSWR(url, fetcher);
  const reports = Array.isArray(data?.data?.reports) ? data.data.reports : [];
  const pagination = data?.data?.pagination;

  async function setReportStatus(reportId: string, nextStatus: 'open' | 'reviewed' | 'dismissed') {
    await fetch('/api/admin/reports', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ reportId, status: nextStatus }),
    });
    mutate();
  }

  async function moderateTarget(reportId: string, action: 'hide_target' | 'delete_target') {
    await fetch('/api/admin/reports', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ reportId, action }),
    });
    mutate();
  }

  function renderTargetCell(r: any) {
    const tp = r?.targetPreview;

    const base = (
      <>
        <div className="text-xs text-gray-400">{r.targetType}</div>
        <div className="font-mono text-xs text-gray-400">{String(r.targetId)}</div>
      </>
    );

    if (!tp || typeof tp !== 'object') return base;

    if (r.targetType === 'post') {
      const title = typeof tp.title === 'string' ? tp.title : null;
      const excerpt = typeof tp.excerpt === 'string' ? tp.excerpt : null;
      const slug = typeof tp.slug === 'string' ? tp.slug : null;
      const status = typeof tp.status === 'string' ? tp.status : null;

      return (
        <>
          <div className="flex items-center gap-2">
            <div className="text-xs text-gray-400">post</div>
            {status ? <span className="text-[11px] text-gray-500">({status})</span> : null}
          </div>
          {title ? (
            slug ? (
              <Link href={`/community/${slug}`} className="text-sm font-semibold text-terminal-accent hover:underline">
                {title}
              </Link>
            ) : (
              <div className="text-sm font-semibold text-gray-200">{title}</div>
            )
          ) : null}
          {excerpt ? (
            <div className="mt-1 line-clamp-2 max-w-[460px] text-xs text-gray-300" title={excerpt}>
              {excerpt}
            </div>
          ) : null}
          <div className="mt-1 font-mono text-xs text-gray-500">{String(r.targetId)}</div>
        </>
      );
    }

    if (r.targetType === 'comment') {
      const excerpt = typeof tp.excerpt === 'string' ? tp.excerpt : null;
      const postSlug = typeof tp.postSlug === 'string' ? tp.postSlug : null;
      const status = typeof tp.status === 'string' ? tp.status : null;

      return (
        <>
          <div className="flex items-center gap-2">
            <div className="text-xs text-gray-400">comment</div>
            {status ? <span className="text-[11px] text-gray-500">({status})</span> : null}
            {postSlug ? (
              <Link href={`/community/${postSlug}`} className="text-[11px] text-terminal-accent hover:underline">
                view post
              </Link>
            ) : null}
          </div>
          {excerpt ? (
            <div className="mt-1 line-clamp-2 max-w-[460px] text-xs text-gray-300" title={excerpt}>
              {excerpt}
            </div>
          ) : null}
          <div className="mt-1 font-mono text-xs text-gray-500">{String(r.targetId)}</div>
        </>
      );
    }

    return base;
  }

  return (
    <main className="min-h-screen bg-terminal-bg text-terminal-text">
      <div className="mx-auto max-w-6xl px-4 py-10">
        <div className="flex items-end justify-between gap-3">
          <div>
            <h1 className="text-2xl font-bold">Admin • Reports</h1>
            <p className="mt-1 text-sm text-gray-400">User reports for community posts/comments.</p>
          </div>
          <Link href="/admin/dashboard" className="text-sm text-gray-400 hover:text-terminal-accent">
            ← Back to dashboard
          </Link>
        </div>

        <div className="mt-6 flex flex-wrap items-center gap-2">
          <label className="text-xs text-gray-400">Status</label>
          <select
            value={status}
            onChange={(e) => {
              setPage(1);
              setStatus(e.target.value as any);
            }}
            className="rounded-md border border-terminal-border bg-terminal-panel px-3 py-2 text-sm"
          >
            <option value="open">Open</option>
            <option value="reviewed">Reviewed</option>
            <option value="dismissed">Dismissed</option>
            <option value="all">All</option>
          </select>
        </div>

        <div className="mt-6">
          {error ? (
            <div className="rounded-xl border border-terminal-border bg-terminal-panel p-4 text-sm text-red-300">
              Failed to load reports.
            </div>
          ) : isLoading ? (
            <div className="rounded-xl border border-terminal-border bg-terminal-panel p-4 text-sm text-gray-400">Loading…</div>
          ) : reports.length === 0 ? (
            <div className="rounded-xl border border-terminal-border bg-terminal-panel p-6 text-sm text-gray-400">
              No reports.
            </div>
          ) : (
            <div className="overflow-hidden rounded-xl border border-terminal-border">
              <table className="w-full text-left text-sm">
                <thead className="bg-terminal-panel text-gray-400">
                  <tr>
                    <th className="px-3 py-2">Target</th>
                    <th className="px-3 py-2">Reason</th>
                    <th className="px-3 py-2">Reporter</th>
                    <th className="px-3 py-2">Details</th>
                    <th className="px-3 py-2">Status</th>
                    <th className="px-3 py-2">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-terminal-border bg-terminal-bg">
                  {reports.map((r: any) => (
                    <tr key={r._id}>
                      <td className="px-3 py-3 text-gray-200">
                        {renderTargetCell(r)}
                      </td>
                      <td className="px-3 py-3 text-gray-200">{r.reason}</td>
                      <td className="px-3 py-3 text-gray-200">
                        {r.reporterEmail || <span className="text-gray-500">(anonymous)</span>}
                      </td>
                      <td className="px-3 py-3 text-gray-300">
                        <div className="max-w-[420px] truncate" title={r.details || ''}>
                          {r.details || <span className="text-gray-500">(none)</span>}
                        </div>
                        <div className="mt-1 text-xs text-gray-500">
                          {r.createdAt ? new Date(r.createdAt).toLocaleString() : ''}
                        </div>
                      </td>
                      <td className="px-3 py-3 text-gray-200">{r.status}</td>
                      <td className="px-3 py-3">
                        <div className="flex flex-wrap gap-2">
                          <button
                            onClick={() => moderateTarget(String(r._id), 'hide_target')}
                            className="rounded-md border border-terminal-border px-2 py-1 text-xs text-gray-200 hover:border-terminal-accent"
                            title="Hide the reported post/comment"
                          >
                            Hide target
                          </button>
                          <button
                            onClick={() => moderateTarget(String(r._id), 'delete_target')}
                            className="rounded-md border border-terminal-border px-2 py-1 text-xs text-red-200 hover:border-red-400"
                            title="Delete the reported post/comment"
                          >
                            Delete target
                          </button>
                          <button
                            onClick={() => setReportStatus(String(r._id), 'reviewed')}
                            className="rounded-md border border-terminal-border px-2 py-1 text-xs text-gray-200 hover:border-terminal-accent"
                          >
                            Mark reviewed
                          </button>
                          <button
                            onClick={() => setReportStatus(String(r._id), 'dismissed')}
                            className="rounded-md border border-terminal-border px-2 py-1 text-xs text-gray-200 hover:border-terminal-accent"
                          >
                            Dismiss
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {pagination ? (
          <div className="mt-6 flex items-center justify-between text-sm text-gray-400">
            <div>
              Page {pagination.page} / {pagination.pages} • Total {pagination.total}
            </div>
            <div className="flex gap-2">
              <button
                disabled={page <= 1}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                className="rounded-md border border-terminal-border px-3 py-2 disabled:opacity-50"
              >
                Prev
              </button>
              <button
                disabled={page >= pagination.pages}
                onClick={() => setPage((p) => p + 1)}
                className="rounded-md border border-terminal-border px-3 py-2 disabled:opacity-50"
              >
                Next
              </button>
            </div>
          </div>
        ) : null}
      </div>
    </main>
  );
}
