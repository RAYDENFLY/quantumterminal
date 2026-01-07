'use client';

import Link from 'next/link';
import { useState } from 'react';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [ok, setOk] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setOk(null);
    setLoading(true);

    try {
      const res = await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });

      if (!res.ok) {
        setError('Gagal memproses permintaan. Coba lagi.');
        return;
      }

      // Always show success to avoid user enumeration.
      setOk('Kalau email terdaftar, link reset akan diproses. (Cek email / log server).');
      setEmail('');
    } catch {
      setError('Gagal memproses permintaan.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen bg-terminal-bg text-terminal-text">
      <div className="mx-auto max-w-md px-4 py-10">
        <h1 className="text-2xl font-bold">Lupa Password</h1>
        <p className="mt-2 text-sm text-gray-300">Masukkan email akunmu untuk reset password.</p>

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
            {loading ? 'Processing…' : 'Kirim link reset'}
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
