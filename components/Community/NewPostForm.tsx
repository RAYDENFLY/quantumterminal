'use client';

import Link from 'next/link';
import { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import useSWR from 'swr';
import { COMMUNITY_CATEGORIES, type CommunityCategoryId } from './CommunityCategories';

const fetcher = (url: string) => fetch(url).then((r) => r.json());

type CoinListItem = { id: string; symbol: string; name: string };

export default function NewPostForm() {
  const router = useRouter();
  const [category, setCategory] = useState<CommunityCategoryId>('discussion');
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [coinQuery, setCoinQuery] = useState('');
  const [selectedCoins, setSelectedCoins] = useState<Array<{ coinId: string; symbol: string; name: string; image?: string }>>([]);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const { data: coinsData } = useSWR('/api/coins/list', fetcher);
  const coins: CoinListItem[] = Array.isArray(coinsData?.coins) ? coinsData.coins : [];

  const matches = useMemo(() => {
    const q = coinQuery.trim().toLowerCase();
    if (!q) return [];
    // Lightweight local filter; CoinGecko list is big so cap results.
    return coins
      .filter((c) => c.symbol?.toLowerCase().includes(q) || c.name?.toLowerCase().includes(q))
      .slice(0, 20);
  }, [coinQuery, coins]);

  async function submit() {
    setError(null);
    setSubmitting(true);
    try {
      const res = await fetch('/api/community/posts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          category,
          title,
          body,
          coinTags: selectedCoins,
        }),
      });

      const json = (await res.json().catch(() => null)) as any;
      if (!res.ok || !json?.success) {
        setError(json?.error || 'Failed to create post.');
        return;
      }

      router.push(`/community/${json.post.slug}`);
    } catch {
      setError('Failed to create post.');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="mx-auto max-w-3xl px-4 py-8 text-terminal-text">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Create post</h1>
          <p className="mt-1 text-sm text-gray-400">Thread-based discussions. No signals. No financial advice.</p>
        </div>
        <Link href="/community" className="text-sm text-gray-400 hover:text-terminal-accent">
          ← Back
        </Link>
      </div>

      <div className="mt-6 rounded-xl border border-terminal-border bg-terminal-panel p-5">
        <label className="text-xs text-gray-400">Category</label>
        <select
          value={category}
          onChange={(e) => setCategory(e.target.value as any)}
          className="mt-1 w-full rounded-md border border-terminal-border bg-terminal-bg px-3 py-2 text-sm"
        >
          {COMMUNITY_CATEGORIES.map((c) => (
            <option key={c.id} value={c.id}>
              {c.label}
            </option>
          ))}
        </select>
        <div className="mt-2 text-xs text-gray-500">
          Choose the best fit. <span className="text-gray-300">Coin Analysis</span> is allowed, but this isn’t a signals page.
        </div>

        <label className="mt-4 text-xs text-gray-400">Title</label>
        <input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className="mt-1 w-full rounded-md border border-terminal-border bg-terminal-bg px-3 py-2 text-sm"
          placeholder="e.g. ETH L2 adoption in 2026"
          maxLength={120}
        />

        <label className="mt-4 text-xs text-gray-400">Body</label>
        <textarea
          value={body}
          onChange={(e) => setBody(e.target.value)}
          className="mt-1 h-44 w-full rounded-md border border-terminal-border bg-terminal-bg px-3 py-2 text-sm"
          placeholder="Write your post… (min 10 chars)"
          maxLength={20000}
        />

        <div className="mt-4">
          <label className="text-xs text-gray-400">Coin tags (optional)</label>
          <input
            value={coinQuery}
            onChange={(e) => setCoinQuery(e.target.value)}
            className="mt-1 w-full rounded-md border border-terminal-border bg-terminal-bg px-3 py-2 text-sm"
            placeholder="Search BTC, ETH, SOL…"
          />
          {coinQuery.trim() && matches.length ? (
            <div className="mt-2 max-h-48 overflow-auto rounded-md border border-terminal-border bg-terminal-bg">
              {matches.map((c) => {
                const already = selectedCoins.some((s) => s.coinId === c.id);
                return (
                  <button
                    key={c.id}
                    type="button"
                    disabled={already || selectedCoins.length >= 5}
                    onClick={() => {
                      setSelectedCoins((prev) => [...prev, { coinId: c.id, symbol: c.symbol, name: c.name }]);
                      setCoinQuery('');
                    }}
                    className="flex w-full items-center justify-between px-3 py-2 text-left text-sm hover:bg-terminal-panel disabled:opacity-50"
                  >
                    <span className="text-gray-200">
                      {c.name} <span className="text-gray-500">({c.symbol.toUpperCase()})</span>
                    </span>
                    <span className="text-gray-500">{already ? 'Added' : '+'}</span>
                  </button>
                );
              })}
            </div>
          ) : null}

          {selectedCoins.length ? (
            <div className="mt-2 flex flex-wrap gap-2">
              {selectedCoins.map((t) => (
                <button
                  key={t.coinId}
                  type="button"
                  onClick={() => setSelectedCoins((prev) => prev.filter((p) => p.coinId !== t.coinId))}
                  className="rounded-full border border-terminal-border bg-terminal-bg px-2 py-0.5 text-xs text-gray-300 hover:border-terminal-accent"
                  title="Remove"
                >
                  {t.symbol.toUpperCase()} ×
                </button>
              ))}
            </div>
          ) : (
            <div className="mt-2 text-xs text-gray-500">Tip: Keep it focused. Max 5 coin tags.</div>
          )}
        </div>

        {error ? (
          <div className="mt-4 rounded-md border border-terminal-border bg-terminal-bg p-3 text-sm text-red-300">{error}</div>
        ) : null}

        <button
          type="button"
          onClick={submit}
          disabled={submitting}
          className="mt-5 w-full rounded-md bg-terminal-accent px-4 py-2 text-sm font-semibold text-terminal-bg disabled:opacity-60"
        >
          {submitting ? 'Publishing…' : 'Publish post'}
        </button>

        <div className="mt-3 text-xs text-gray-500">
          By posting, you agree to keep it respectful. No scams, spam, impersonation, or financial advice.
        </div>
      </div>
    </div>
  );
}
