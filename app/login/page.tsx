'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState } from 'react';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      const json = (await res.json()) as { success: boolean; error?: string };
      if (!res.ok || !json.success) {
        setError(json.error || 'Login failed.');
        return;
      }

      router.push('/');
    } catch {
      setError('Login failed.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen bg-terminal-bg text-terminal-text">
      <div className="mx-auto max-w-md px-4 py-10">
        <h1 className="text-2xl font-bold">Login</h1>
        <p className="mt-2 text-sm text-gray-300">
          Masuk untuk akses fitur komunitas (watchlist & diskusi).
        </p>

        <form onSubmit={onSubmit} className="mt-6 rounded-xl border border-terminal-border bg-terminal-panel p-5">
          <label className="block text-sm text-gray-300">Email</label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="mt-2 w-full rounded-md border border-terminal-border bg-terminal-bg px-3 py-2 text-sm text-terminal-text outline-none focus:border-terminal-accent"
            required
          />

          <label className="mt-4 block text-sm text-gray-300">Password</label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="mt-2 w-full rounded-md border border-terminal-border bg-terminal-bg px-3 py-2 text-sm text-terminal-text outline-none focus:border-terminal-accent"
            required
          />

          {error ? (
            <div className="mt-4 rounded-md border border-terminal-border bg-terminal-bg p-3 text-sm text-red-300">
              {error}
            </div>
          ) : null}

          <button
            type="submit"
            disabled={loading}
            className="mt-5 w-full rounded-md bg-terminal-accent px-4 py-2 text-sm font-semibold text-terminal-bg disabled:opacity-60"
          >
            {loading ? 'Logging in…' : 'Login'}
          </button>

          <div className="mt-4 text-xs text-gray-400">
            Belum punya akun?{' '}
            <Link href="/register" className="text-terminal-accent hover:underline">
              Register
            </Link>
          </div>
        </form>

        <div className="mt-4">
          <Link href="/" className="text-sm text-gray-400 hover:text-terminal-accent">
            ← Kembali
          </Link>
        </div>
      </div>
    </main>
  );
}
