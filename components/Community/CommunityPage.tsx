'use client';

import Link from 'next/link';
import { useMemo, useState } from 'react';
import useSWR from 'swr';
import TopBar from '@/components/TopBar';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faExternalLinkAlt } from '@fortawesome/free-solid-svg-icons';
import CommunityDisclaimer from './CommunityDisclaimer';
import { COMMUNITY_CATEGORIES, type CommunityCategoryId } from './CommunityCategories';

const fetcher = (url: string) => fetch(url).then((r) => r.json());

function categoryLabel(id: string) {
  return COMMUNITY_CATEGORIES.find((c) => c.id === id)?.label ?? id;
}

export default function CommunityPage() {
  const [activeModule, setActiveModule] = useState('community');
  const [category, setCategory] = useState<CommunityCategoryId | 'all'>('all');
  const [q, setQ] = useState('');
  const [sort, setSort] = useState<'newest' | 'top_24h' | 'top_all'>('newest');

  const apiUrl = useMemo(() => {
    const sp = new URLSearchParams();
    if (category !== 'all') sp.set('category', category);
    if (q.trim()) sp.set('q', q.trim());
    if (sort !== 'newest') sp.set('sort', sort);
    sp.set('limit', '25');
    return `/api/community/posts?${sp.toString()}`;
  }, [category, q, sort]);

  const { data, error, isLoading } = useSWR(apiUrl, fetcher);

  const posts = Array.isArray(data?.posts) ? data.posts : [];

  return (
    <div className="min-h-screen flex flex-col">
      <TopBar activeModule={activeModule} setActiveModule={setActiveModule} />

      <main className="flex-1">
        <div className="mx-auto max-w-5xl px-4 py-8 text-terminal-text">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold">Community</h1>
          <p className="mt-1 text-sm text-gray-400">Discussions, coin analysis, jobs, and tools. Lightweight and searchable.</p>
        </div>
        <Link
          href="/community/new"
          className="inline-flex items-center justify-center rounded-md bg-terminal-accent px-4 py-2 text-sm font-semibold text-terminal-bg"
        >
          + Create post
        </Link>
      </div>

      <div className="mt-5">
        <CommunityDisclaimer />
      </div>

      <div className="mt-6 grid gap-3 sm:grid-cols-4">
        <div className="sm:col-span-1">
          <label className="text-xs text-gray-400">Category</label>
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value as any)}
            className="mt-1 w-full rounded-md border border-terminal-border bg-terminal-bg px-3 py-2 text-sm"
          >
            <option value="all">All</option>
            {COMMUNITY_CATEGORIES.map((c) => (
              <option key={c.id} value={c.id}>
                {c.label}
              </option>
            ))}
          </select>
        </div>
        <div className="sm:col-span-1">
          <label className="text-xs text-gray-400">Sort</label>
          <select
            value={sort}
            onChange={(e) => setSort(e.target.value as any)}
            className="mt-1 w-full rounded-md border border-terminal-border bg-terminal-bg px-3 py-2 text-sm"
          >
            <option value="newest">Newest</option>
            <option value="top_24h">Top (24h)</option>
            <option value="top_all">Top (all-time)</option>
          </select>
        </div>
        <div className="sm:col-span-2">
          <label className="text-xs text-gray-400">Search</label>
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search titles…"
            className="mt-1 w-full rounded-md border border-terminal-border bg-terminal-bg px-3 py-2 text-sm"
          />
        </div>
      </div>

      <div className="mt-6">
        {error ? (
          <div className="rounded-xl border border-terminal-border bg-terminal-panel p-4 text-sm text-red-300">
            Failed to load posts.
          </div>
        ) : isLoading ? (
          <div className="rounded-xl border border-terminal-border bg-terminal-panel p-4 text-sm text-gray-400">Loading…</div>
        ) : posts.length === 0 ? (
          <div className="rounded-xl border border-terminal-border bg-terminal-panel p-6 text-sm text-gray-400">
            No posts yet. Be the first to start a discussion.
          </div>
        ) : (
          <div className="space-y-3">
            {posts.map((p: any) => (
              <Link
                key={p.slug}
                href={`/community/${p.slug}`}
                className="block rounded-xl border border-terminal-border bg-terminal-panel p-4 hover:border-terminal-accent"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="text-sm text-gray-400">
                      <span className="text-terminal-accent">{categoryLabel(p.category)}</span>
                      <span className="mx-2">•</span>
                      <span>{p.authorEmail}</span>
                      <span className="mx-2">•</span>
                      <span>{p.createdAt ? new Date(p.createdAt).toLocaleString() : ''}</span>
                    </div>
                    <div className="mt-1 text-base font-semibold text-terminal-text truncate">{p.title}</div>
                    {Array.isArray(p.coinTags) && p.coinTags.length ? (
                      <div className="mt-2 flex flex-wrap gap-2">
                        {p.coinTags.map((t: any) => (
                          <span
                            key={`${t.coinId}`}
                            className="rounded-full border border-terminal-border bg-terminal-bg px-2 py-0.5 text-xs text-gray-300"
                            title={t.name}
                          >
                            {String(t.symbol || '').toUpperCase()}
                          </span>
                        ))}
                      </div>
                    ) : null}
                  </div>
                  <div className="shrink-0 text-right text-xs text-gray-400">
                    <div>💬 {p.commentsCount ?? 0}</div>
                    <div>⬆️ {p.upvotesCount ?? 0}</div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
        </div>
      </main>

      <footer className="border-t border-terminal-border p-4 text-center text-xs text-gray-500">
        <p>⚠️ DISCLAIMER: For informational and educational purposes only. Not financial advice.</p>
        <p className="mt-1">
          Data provided by CoinGecko, CoinDesk, Alternative.me, Mempool.space, Blockchain.com, and DeFi Llama
        </p>
        <div className="mt-2 flex items-center justify-center space-x-2">
          <a
            href="https://github.com/RAYDENFLY/quantumterminal"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center space-x-2 text-gray-400 hover:text-terminal-accent transition-colors"
          >
            <FontAwesomeIcon icon={faExternalLinkAlt} className="w-4 h-4" />
            <span>GitHub</span>
          </a>
          <span className="text-gray-600">•</span>
          <p className="font-bold text-terminal-accent">Quantum Terminal</p>
        </div>
      </footer>
    </div>
  );
}
