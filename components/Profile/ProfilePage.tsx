'use client';

import Link from 'next/link';
import { useMemo, useState } from 'react';
import useSWR from 'swr';

const fetcher = (url: string) => fetch(url).then((r) => r.json());

type ProfileResponse = {
  success: boolean;
  error?: string;
  profile?: {
    username: string;
    bio: string;
    joinDate: string;
    stats: { posts: number; comments: number };
    topCoins: Array<{ coinId: string; symbol: string; name: string; count: number }>;
  };
};

type MeResponse = {
  success: boolean;
  user: null | { id: string; email: string; role: 'user' | 'admin'; username?: string };
};

type PostListResponse = {
  success: boolean;
  posts?: Array<{
    slug: string;
    title: string;
    category: string;
    createdAt: string;
    upvotesCount: number;
    commentsCount: number;
    status: 'active' | 'hidden' | 'deleted';
    coinTags: Array<{ coinId: string; symbol: string; name: string }>;
  }>;
  error?: string;
};

type CommentListResponse = {
  success: boolean;
  comments?: Array<{
    _id: string;
    body: string;
    createdAt: string;
    status: 'active' | 'hidden' | 'deleted';
    postId: string;
    post: null | { slug: string; title: string };
  }>;
  error?: string;
};

function formatJoinDate(iso: string) {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '';
  return d.toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: '2-digit' });
}

function formatCount(n: number) {
  return new Intl.NumberFormat().format(n);
}

function clampSnippet(text: string, max = 180) {
  const t = text.replace(/\s+/g, ' ').trim();
  if (t.length <= max) return t;
  return `${t.slice(0, max)}…`;
}

export default function ProfilePage({ username }: { username: string }) {
  const normalized = String(username || '').toLowerCase();

  const { data: meData } = useSWR<MeResponse>('/api/auth/me', fetcher);
  const { data: profileData, error: profileErr, mutate: mutateProfile } = useSWR<ProfileResponse>(
    `/api/profiles/${encodeURIComponent(normalized)}`,
    fetcher
  );

  const profile = profileData?.profile ?? null;
  const me = meData?.success ? meData.user : null;

  const isOwner = useMemo(() => {
    if (!me?.username) return false;
    return String(me.username).toLowerCase() === normalized;
  }, [me?.username, normalized]);

  const [tab, setTab] = useState<'overview' | 'posts' | 'comments' | 'settings'>('overview');

  const { data: myPostsData, mutate: mutateMyPosts } = useSWR<PostListResponse>(
    isOwner && tab === 'posts' ? `/api/users/${encodeURIComponent(normalized)}/posts` : null,
    fetcher
  );

  const { data: myCommentsData, mutate: mutateMyComments } = useSWR<CommentListResponse>(
    isOwner && tab === 'comments' ? `/api/users/${encodeURIComponent(normalized)}/comments` : null,
    fetcher
  );

  const [editUsername, setEditUsername] = useState('');
  const [editBio, setEditBio] = useState('');
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [saveOk, setSaveOk] = useState<string | null>(null);

  const canRender = !profileErr && (profileData?.success ?? true);

  const showNotFound = profileData && profileData.success === false && profileData.error === 'Not found';

  async function startEdit() {
    setSaveError(null);
    setSaveOk(null);
    setEditUsername(profile?.username ?? normalized);
    setEditBio(profile?.bio ?? '');
  }

  async function saveProfile() {
    setSaving(true);
    setSaveError(null);
    setSaveOk(null);

    try {
      const res = await fetch(`/api/profiles/${encodeURIComponent(normalized)}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: editUsername, bio: editBio }),
      });
      const json = (await res.json()) as ProfileResponse;
      if (!res.ok || !json.success) {
        throw new Error(json.error || 'Failed to update profile.');
      }

      setSaveOk('Saved.');
      await mutateProfile();

      // If username changed, user should navigate to the new profile URL.
      if (json.profile?.username && json.profile.username.toLowerCase() !== normalized) {
        window.location.href = `/u/${encodeURIComponent(json.profile.username)}`;
        return;
      }

      await startEdit();
    } catch (e) {
      setSaveError(e instanceof Error ? e.message : 'Failed to update profile.');
    } finally {
      setSaving(false);
    }
  }

  if (showNotFound) {
    return (
      <div className="min-h-screen bg-terminal-bg text-terminal-text">
        <div className="mx-auto max-w-4xl px-4 py-10">
          <h1 className="text-xl font-semibold">Profile not found</h1>
          <p className="mt-2 text-sm text-gray-400">This profile doesn’t exist.</p>
          <div className="mt-6">
            <Link
              href="/community"
              className="rounded-md border border-terminal-border px-3 py-2 text-sm hover:border-terminal-accent"
            >
              Back to Community
            </Link>
          </div>
        </div>
      </div>
    );
  }

  if (!canRender || !profile) {
    return (
      <div className="min-h-screen bg-terminal-bg text-terminal-text">
        <div className="mx-auto max-w-4xl px-4 py-10">
          <div className="rounded-xl border border-terminal-border bg-terminal-panel p-5">
            <div className="text-sm text-gray-400">Loading profile…</div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-terminal-bg text-terminal-text">
      <div className="mx-auto max-w-4xl px-4 py-10">
        <div className="flex items-center justify-between gap-3">
          <div>
            <div className="text-xs text-gray-400">Quantum Terminal • Community Profile</div>
            <h1 className="mt-1 text-2xl font-semibold">{profile.username}</h1>
          </div>
          <div className="flex items-center gap-2">
            <Link
              href="/community"
              className="rounded-md border border-terminal-border px-3 py-2 text-sm hover:border-terminal-accent"
            >
              Community
            </Link>
          </div>
        </div>

        <div className="mt-6 grid grid-cols-1 gap-4">
          {/* Public profile section */}
          <div className="rounded-xl border border-terminal-border bg-terminal-panel p-5">
            <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
              <div className="md:col-span-2">
                <div className="text-xs uppercase tracking-wide text-gray-400">About</div>
                <div className="mt-2 whitespace-pre-wrap text-sm text-gray-200">
                  {profile.bio ? profile.bio : <span className="text-gray-500">No bio.</span>}
                </div>
              </div>
              <div>
                <div className="text-xs uppercase tracking-wide text-gray-400">Summary</div>
                <div className="mt-2 space-y-1 text-sm">
                  <div className="flex items-center justify-between">
                    <span className="text-gray-400">Joined</span>
                    <span>{formatJoinDate(profile.joinDate)}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-gray-400">Posts</span>
                    <span>{formatCount(profile.stats.posts)}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-gray-400">Comments</span>
                    <span>{formatCount(profile.stats.comments)}</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-4">
              <div className="text-xs uppercase tracking-wide text-gray-400">Frequently tagged coins</div>
              <div className="mt-2 flex flex-wrap gap-2">
                {profile.topCoins?.length ? (
                  profile.topCoins.map((c) => (
                    <span
                      key={c.coinId}
                      className="rounded-full border border-terminal-border bg-black/20 px-3 py-1 text-xs text-gray-200"
                      title={`${c.name} • ${c.count} posts`}
                    >
                      {c.symbol.toUpperCase()}
                      <span className="ml-2 text-gray-500">{c.count}</span>
                    </span>
                  ))
                ) : (
                  <span className="text-sm text-gray-500">No tagged coins yet.</span>
                )}
              </div>
            </div>
          </div>

          {/* Private section */}
          {isOwner ? (
            <div className="rounded-xl border border-terminal-border bg-terminal-panel p-5">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <div className="text-xs uppercase tracking-wide text-gray-400">Private</div>
                  <div className="mt-1 text-sm text-gray-200">Only you can see and edit this section.</div>
                </div>
              </div>

              <div className="mt-4 flex flex-wrap gap-2">
                <button
                  onClick={() => setTab('overview')}
                  className={`rounded-md border px-3 py-2 text-xs ${
                    tab === 'overview'
                      ? 'border-terminal-accent text-terminal-accent'
                      : 'border-terminal-border text-gray-200 hover:border-terminal-accent'
                  }`}
                >
                  Edit profile
                </button>
                <button
                  onClick={() => setTab('posts')}
                  className={`rounded-md border px-3 py-2 text-xs ${
                    tab === 'posts'
                      ? 'border-terminal-accent text-terminal-accent'
                      : 'border-terminal-border text-gray-200 hover:border-terminal-accent'
                  }`}
                >
                  My posts
                </button>
                <button
                  onClick={() => setTab('comments')}
                  className={`rounded-md border px-3 py-2 text-xs ${
                    tab === 'comments'
                      ? 'border-terminal-accent text-terminal-accent'
                      : 'border-terminal-border text-gray-200 hover:border-terminal-accent'
                  }`}
                >
                  My comments
                </button>
                <button
                  onClick={() => setTab('settings')}
                  className={`rounded-md border px-3 py-2 text-xs ${
                    tab === 'settings'
                      ? 'border-terminal-accent text-terminal-accent'
                      : 'border-terminal-border text-gray-200 hover:border-terminal-accent'
                  }`}
                >
                  Settings
                </button>
              </div>

              {tab === 'overview' ? (
                <div className="mt-5 grid grid-cols-1 gap-4 md:grid-cols-2">
                  <div>
                    <div className="text-xs uppercase tracking-wide text-gray-400">Username</div>
                    <input
                      value={editUsername}
                      onFocus={() => {
                        if (!editUsername) void startEdit();
                      }}
                      onChange={(e) => setEditUsername(e.target.value)}
                      placeholder={profile.username}
                      className="mt-2 w-full rounded-md border border-terminal-border bg-transparent px-3 py-2 text-sm outline-none focus:border-terminal-accent"
                    />
                    <div className="mt-2 text-xs text-gray-500">
                      Lowercase letters, numbers, underscores. Used in your public profile URL.
                    </div>
                  </div>
                  <div>
                    <div className="text-xs uppercase tracking-wide text-gray-400">Bio</div>
                    <textarea
                      value={editBio}
                      onFocus={() => {
                        if (!editUsername) void startEdit();
                      }}
                      onChange={(e) => setEditBio(e.target.value)}
                      placeholder="Optional. Keep it short and professional."
                      rows={4}
                      className="mt-2 w-full rounded-md border border-terminal-border bg-transparent px-3 py-2 text-sm outline-none focus:border-terminal-accent"
                    />
                    <div className="mt-2 text-xs text-gray-500">Text only. 280 chars max.</div>
                  </div>

                  <div className="md:col-span-2 flex items-center gap-3">
                    <button
                      onClick={saveProfile}
                      disabled={saving}
                      className="rounded-md bg-terminal-accent px-4 py-2 text-sm font-medium text-black disabled:opacity-60"
                    >
                      {saving ? 'Saving…' : 'Save'}
                    </button>
                    {saveOk ? <span className="text-sm text-green-400">{saveOk}</span> : null}
                    {saveError ? <span className="text-sm text-red-400">{saveError}</span> : null}
                  </div>

                  <div className="md:col-span-2 mt-2 rounded-md border border-terminal-border bg-black/20 p-4">
                    <div className="text-xs uppercase tracking-wide text-gray-400">Watchlist</div>
                    <div className="mt-1 text-sm text-gray-500">Coming later.</div>
                  </div>
                </div>
              ) : null}

              {tab === 'posts' ? (
                <div className="mt-5">
                  <div className="text-xs uppercase tracking-wide text-gray-400">Your latest posts</div>
                  <div className="mt-3 space-y-2">
                    {myPostsData?.posts?.length ? (
                      myPostsData.posts.map((p) => (
                        <Link
                          key={p.slug}
                          href={`/community/${p.slug}`}
                          className="block rounded-md border border-terminal-border bg-black/10 p-3 hover:border-terminal-accent"
                          onClick={() => void mutateMyPosts()}
                        >
                          <div className="flex items-center justify-between gap-3">
                            <div className="text-sm font-medium">{p.title}</div>
                            <div className="text-xs text-gray-400">
                              {new Date(p.createdAt).toLocaleDateString()}
                            </div>
                          </div>
                          <div className="mt-1 text-xs text-gray-400">
                            {p.category} • {p.upvotesCount} upvotes • {p.commentsCount} comments
                          </div>
                        </Link>
                      ))
                    ) : (
                      <div className="text-sm text-gray-500">No posts yet.</div>
                    )}
                  </div>
                </div>
              ) : null}

              {tab === 'comments' ? (
                <div className="mt-5">
                  <div className="text-xs uppercase tracking-wide text-gray-400">Your latest comments</div>
                  <div className="mt-3 space-y-2">
                    {myCommentsData?.comments?.length ? (
                      myCommentsData.comments.map((c) => (
                        <div
                          key={c._id}
                          className="rounded-md border border-terminal-border bg-black/10 p-3"
                        >
                          <div className="flex items-center justify-between gap-3">
                            {c.post ? (
                              <Link
                                href={`/community/${c.post.slug}`}
                                className="text-sm font-medium hover:text-terminal-accent"
                                onClick={() => void mutateMyComments()}
                              >
                                {c.post.title}
                              </Link>
                            ) : (
                              <div className="text-sm font-medium">Post removed</div>
                            )}
                            <div className="text-xs text-gray-400">
                              {new Date(c.createdAt).toLocaleDateString()}
                            </div>
                          </div>
                          <div className="mt-2 text-sm text-gray-200">{clampSnippet(c.body)}</div>
                        </div>
                      ))
                    ) : (
                      <div className="text-sm text-gray-500">No comments yet.</div>
                    )}
                  </div>
                </div>
              ) : null}

              {tab === 'settings' ? (
                <div className="mt-5 grid grid-cols-1 gap-3">
                  <div className="rounded-md border border-terminal-border bg-black/20 p-4">
                    <div className="text-xs uppercase tracking-wide text-gray-400">Account settings</div>
                    <div className="mt-1 text-sm text-gray-500">
                      Placeholder. Basic settings will be added here.
                    </div>
                  </div>
                  <div className="rounded-md border border-terminal-border bg-black/20 p-4">
                    <div className="text-xs uppercase tracking-wide text-gray-400">Privacy</div>
                    <div className="mt-1 text-sm text-gray-500">
                      Your public profile shows username, bio (optional), join date, and public activity counts.
                      Private content like your email and sessions are never displayed.
                    </div>
                  </div>
                </div>
              ) : null}
            </div>
          ) : null}
        </div>

        {!isOwner && me ? (
          <div className="mt-6 text-xs text-gray-500">
            You’re viewing a public profile. There are no followers, DMs, or social feeds on Quantum Terminal.
          </div>
        ) : null}
      </div>
    </div>
  );
}
