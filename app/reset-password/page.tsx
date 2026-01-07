'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

export default function ResetPasswordPage() {
  const router = useRouter();

  const [email, setEmail] = useState('');
  const [token, setToken] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [ok, setOk] = useState<string | null>(null);

  useEffect(() => {
    // Client-only: safe parsing of query params
    try {
      const sp = new URLSearchParams(window.location.search);
      const qEmail = sp.get('email') || '';
      const qToken = sp.get('token') || '';
      if (qEmail) setEmail(qEmail);
      if (qToken) setToken(qToken);
    } catch {
      // ignore
    }
  }, []);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setOk(null);
    setLoading(true);

    try {
      const res = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, token, password }),
      });

      const json = (await res.json().catch(() => null)) as { success?: boolean; error?: string } | null;
      if (!res.ok || !json?.success) {
        setError(json?.error || 'Reset password gagal.');
        return;
      }

      setOk('Password berhasil direset. Redirecting ke login…');
      setTimeout(() => router.push('/login'), 800);
    } catch {
      setError('Reset password gagal.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen bg-terminal-bg text-terminal-text">
      <div className="mx-auto max-w-md px-4 py-10">
        <h1 className="text-2xl font-bold">Reset Password</h1>
        <p className="mt-2 text-sm text-gray-300">Masukkan token reset dan password baru.</p>

        <form onSubmit={onSubmit} className="mt-6 rounded-xl border border-terminal-border bg-terminal-panel p-5">
          <label className="block text-sm text-gray-300">Email</label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="mt-2 w-full rounded-md border border-terminal-border bg-terminal-bg px-3 py-2 text-sm text-terminal-text outline-none focus:border-terminal-accent"
            required
            autoComplete="email"
          />

          <label className="mt-4 block text-sm text-gray-300">Token</label>
          <input
            type="text"
            value={token}
            onChange={(e) => setToken(e.target.value)}
            className="mt-2 w-full rounded-md border border-terminal-border bg-terminal-bg px-3 py-2 text-sm text-terminal-text outline-none focus:border-terminal-accent"
            required
            spellCheck={false}
            autoCapitalize="none"
            autoCorrect="off"
          />

          <label className="mt-4 block text-sm text-gray-300">Password Baru</label>
          <div className="relative mt-2">
            <input
              type={showPassword ? 'text' : 'password'}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full rounded-md border border-terminal-border bg-terminal-bg px-3 py-2 pr-10 text-sm text-terminal-text outline-none focus:border-terminal-accent"
              required
              minLength={10}
              autoComplete="new-password"
            />
            <button
              type="button"
              onClick={() => setShowPassword((v) => !v)}
              aria-label={showPassword ? 'Hide password' : 'Show password'}
              title={showPassword ? 'Hide password' : 'Show password'}
              className="absolute inset-y-0 right-0 flex items-center px-3 text-gray-400 hover:text-terminal-accent"
            >
              {showPassword ? (
                <span className="text-base leading-none">🙈</span>
              ) : (
                <span className="text-base leading-none">👁️</span>
              )}
            </button>
          </div>
          <div className="mt-2 text-xs text-gray-400">Minimal 10 karakter.</div>

          {error ? (
            <div className="mt-4 rounded-md border border-terminal-border bg-terminal-bg p-3 text-sm text-red-300">
              {error}
            </div>
          ) : null}
          {ok ? (
            <div className="mt-4 rounded-md border border-terminal-border bg-terminal-bg p-3 text-sm text-green-300">
              {ok}
            </div>
          ) : null}

          <button
            type="submit"
            disabled={loading}
            className="mt-5 w-full rounded-md bg-terminal-accent px-4 py-2 text-sm font-semibold text-terminal-bg disabled:opacity-60"
          >
            {loading ? 'Resetting…' : 'Reset password'}
          </button>

          <div className="mt-4 text-xs text-gray-400">
            <Link href="/login" className="text-terminal-accent hover:underline">
              ← Kembali ke Login
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
