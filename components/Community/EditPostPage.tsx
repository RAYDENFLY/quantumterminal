'use client';

import Link from 'next/link';
import { useMemo, useState, useEffect } from 'react';
import useSWR from 'swr';
import { COMMUNITY_CATEGORIES, type CommunityCategoryId } from './CommunityCategories';

const fetcher = (url: string) => fetch(url).then((r) => r.json());

export default function EditPostPage({ slug }: { slug: string }) {
  const { data: meData } = useSWR('/api/auth/me', fetcher);
  const { data: postData, error: postErr, mutate: mutatePost } = useSWR(`/api/community/posts/${slug}`, fetcher);

  const user = meData?.success ? meData.user : null;
  const post = postData?.post ?? null;

  const isOwner = useMemo(() => {
    if (!user || !post) return false;
    return String(user.email || '').toLowerCase() === String(post.authorEmail || '').toLowerCase();
  }, [user, post]);

  const [category, setCategory] = useState<CommunityCategoryId>('discussion');
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [ok, setOk] = useState<string | null>(null);

  useEffect(() => {
    if (!post) return;
    setCategory((post.category as CommunityCategoryId) || 'discussion');
    setTitle(String(post.title || ''));
    setBody(String(post.body || ''));
  }, [post]);

  async function onSave() {
    setSaveError(null);
    setOk(null);

    if (!title.trim() || title.trim().length < 4) {
      setSaveError('Title must be at least 4 characters.');
      return;
    }
    if (!body.trim() || body.trim().length < 10) {
      setSaveError('Body must be at least 10 characters.');
      return;
    }

    setSaving(true);
    try {
      const res = await fetch(`/api/community/posts/${slug}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: title.trim(),
          body: body.trim(),
          category,
          coinTags: Array.isArray(post?.coinTags) ? post.coinTags : [],
        }),
      });
      const json = (await res.json().catch(() => null)) as any;
      if (!res.ok || !json?.success) {
        setSaveError(json?.error || 'Failed to save changes.');
        return;
      }
      setOk('Saved.');
      mutatePost();
    } catch {
      setSaveError('Failed to save changes.');
    } finally {
      setSaving(false);
    }
  }

  async function onDelete() {
    if (!confirm('Delete this post? This cannot be undone.')) return;
    setSaveError(null);
    setOk(null);
    setSaving(true);
    try {
      const res = await fetch(`/api/community/posts/${slug}`, { method: 'DELETE' });
      const json = (await res.json().catch(() => null)) as any;
      if (!res.ok || !json?.success) {
        setSaveError(json?.error || 'Failed to delete post.');
        return;
      }
      window.location.href = '/community';
    } catch {
      setSaveError('Failed to delete post.');
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="mx-auto max-w-3xl px-4 py-8 text-terminal-text">
      <div className="flex items-center justify-between">
        <Link href={`/community/${slug}`} className="text-sm text-gray-400 hover:text-terminal-accent">
          ← Back
        </Link>
        <Link href="/community" className="text-sm text-gray-400 hover:text-terminal-accent">
          Community
        </Link>
      </div>

      <h1 className="mt-6 text-xl font-bold">Edit post</h1>

      {postErr ? (
        <div className="mt-4 rounded-xl border border-terminal-border bg-terminal-panel p-4 text-sm text-red-300">
          Failed to load post.
        </div>
      ) : !post ? (
        <div className="mt-4 rounded-xl border border-terminal-border bg-terminal-panel p-4 text-sm text-gray-400">Loading…</div>
      ) : !user ? (
        <div className="mt-4 rounded-xl border border-terminal-border bg-terminal-panel p-4 text-sm text-gray-300">
          Please login to edit posts.
        </div>
      ) : !isOwner && user?.role !== 'admin' ? (
        <div className="mt-4 rounded-xl border border-terminal-border bg-terminal-panel p-4 text-sm text-gray-300">
          You don’t have permission to edit this post.
        </div>
      ) : (
        <div className="mt-4 rounded-xl border border-terminal-border bg-terminal-panel p-5">
          <div className="grid gap-3 sm:grid-cols-4">
            <div className="sm:col-span-1">
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
            </div>
            <div className="sm:col-span-3">
              <label className="text-xs text-gray-400">Title</label>
              <input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="mt-1 w-full rounded-md border border-terminal-border bg-terminal-bg px-3 py-2 text-sm"
                maxLength={120}
              />
            </div>
          </div>

          <div className="mt-4">
            <label className="text-xs text-gray-400">Body</label>
            <textarea
              value={body}
              onChange={(e) => setBody(e.target.value)}
              className="mt-1 h-64 w-full rounded-md border border-terminal-border bg-terminal-bg px-3 py-2 text-sm"
              maxLength={20000}
            />
          </div>

          {saveError ? <div className="mt-3 text-sm text-red-300">{saveError}</div> : null}
          {ok ? <div className="mt-3 text-sm text-green-300">{ok}</div> : null}

          <div className="mt-5 flex flex-wrap gap-2">
            <button
              type="button"
              onClick={onSave}
              disabled={saving}
              className="rounded-md bg-terminal-accent px-4 py-2 text-sm font-semibold text-terminal-bg disabled:opacity-60"
            >
              {saving ? 'Saving…' : 'Save changes'}
            </button>
            <button
              type="button"
              onClick={onDelete}
              disabled={saving}
              className="rounded-md border border-terminal-border px-4 py-2 text-sm text-red-200 hover:border-red-400 disabled:opacity-60"
            >
              Delete post
            </button>
          </div>

          <div className="mt-3 text-xs text-gray-500">
            Editing tags isn’t supported yet (will keep existing tags).
          </div>
        </div>
      )}
    </div>
  );
}
