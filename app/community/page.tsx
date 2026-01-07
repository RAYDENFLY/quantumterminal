'use client';

import useSWR from 'swr';

const fetcher = (url: string) => fetch(url).then((r) => r.json());

export default function CommunityPage() {
  const { data } = useSWR('/api/auth/me', fetcher);
  const user = data?.success ? data.user : null;

  return (
    <main className="min-h-screen bg-terminal-bg text-terminal-text">
      <div className="mx-auto max-w-4xl px-4 py-10">
        <h1 className="text-2xl font-bold">Community</h1>
        <p className="mt-2 text-sm text-gray-300">
          Placeholder page. Nanti di sini akan ada diskusi dan fitur komunitas.
        </p>

        <div className="mt-6 rounded-xl border border-terminal-border bg-terminal-panel p-5">
          <div className="text-sm font-semibold">Session</div>
          <div className="mt-2 text-sm text-gray-200">
            {user ? (
              <div>
                <div>
                  <span className="text-gray-400">Email:</span> {user.email}
                </div>
                <div className="mt-1">
                  <span className="text-gray-400">Role:</span> {user.role}
                </div>
              </div>
            ) : (
              <div className="text-gray-400">Loading…</div>
            )}
          </div>

          <div className="mt-4 text-xs text-gray-400">
            Note: access ke page ini diproteksi oleh middleware (cek cookie). API tetap validasi session di DB.
          </div>
        </div>
      </div>
    </main>
  );
}
