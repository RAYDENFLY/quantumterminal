import Link from 'next/link';

const DONATION_WALLET = '0xD4233500BAE4973782c5eaA427A667ABd6FE9e5f';
const EXPLORER_URL = `https://bscscan.com/address/${DONATION_WALLET}`;

function getBaseUrl() {
  // For server-side fetch inside Next (including build), relative URLs can hang.
  // Use Vercel URL if available, otherwise fall back to localhost.
  const vercel = process.env.VERCEL_URL;
  if (vercel) return `https://${vercel}`;
  const publicUrl = process.env.NEXT_PUBLIC_SITE_URL;
  if (publicUrl) return publicUrl.replace(/\/$/, '');
  return 'http://localhost:3000';
}

async function fetchJsonWithTimeout(url: string, timeoutMs: number) {
  const controller = new AbortController();
  const t = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const res = await fetch(url, {
      signal: controller.signal,
      next: { revalidate: 60 },
    });
    return await res.json();
  } finally {
    clearTimeout(t);
  }
}

async function getLatestLog() {
  try {
    const json = (await fetchJsonWithTimeout(
      `${getBaseUrl()}/api/donation-logs/latest`,
      5000
    )) as { success: boolean; data: any };
    return json?.success ? json.data : null;
  } catch {
    return null;
  }
}

async function getWalletBalance() {
  try {
    const json = (await fetchJsonWithTimeout(
      `${getBaseUrl()}/api/wallet-balance`,
      5000
    )) as {
      success: boolean;
      data?: { balance?: string; symbol?: string };
      error?: string;
    };
    return json;
  } catch {
    return { success: false, error: 'Failed to load wallet balance.' } as const;
  }
}

export default async function DonationPage() {
  const latest = await getLatestLog();
  const balanceRes = await getWalletBalance();

  return (
    <main className="min-h-screen bg-terminal-bg text-terminal-text">
      <div className="mx-auto max-w-4xl px-4 py-10">
        <h1 className="text-2xl font-bold">Donasi</h1>
        <p className="mt-2 text-sm text-gray-300">
          Donasi diterima di BNB Smart Chain (BSC) melalui satu wallet publik.
        </p>

        <div className="mt-6 grid gap-6 md:grid-cols-2">
          <div className="rounded-xl border border-terminal-border bg-terminal-panel p-5">
            <div className="text-sm font-semibold">QR Donasi</div>
            <div className="mt-3 flex items-center justify-center">
              {/* Using img to avoid Next image remote config; this is a local public file */}
              <img
                src="/donasi/qrbinance.png"
                alt="QR Donasi BNB"
                className="max-w-full rounded-lg border border-terminal-border bg-white p-2"
              />
            </div>
          </div>

          <div className="rounded-xl border border-terminal-border bg-terminal-panel p-5">
            <div className="text-sm font-semibold">Alamat Wallet (BSC)</div>
            <div className="mt-2 break-all rounded-md bg-terminal-bg p-3 font-mono text-sm">
              {DONATION_WALLET}
            </div>

            <div className="mt-3 rounded-md border border-terminal-border bg-terminal-bg p-3 text-sm">
              <div className="text-xs text-gray-400">Saldo saat ini (BNB)</div>
              {balanceRes.success ? (
                <div className="mt-1 font-mono text-gray-200">
                  {balanceRes.data?.balance ?? '-'} {balanceRes.data?.symbol ?? 'BNB'}
                </div>
              ) : (
                <div className="mt-1 text-xs text-gray-400">
                  Tidak bisa ambil saldo otomatis. (Set <span className="font-mono">BSC_RPC_URL</span> di env)
                </div>
              )}
            </div>

            <div className="mt-3 flex flex-wrap gap-2">
              <a
                href={EXPLORER_URL}
                target="_blank"
                rel="noreferrer"
                className="rounded-md bg-terminal-accent px-3 py-2 text-xs font-semibold text-terminal-bg"
              >
                Buka di BscScan
              </a>
              <Link
                href="/"
                className="rounded-md border border-terminal-border px-3 py-2 text-xs text-gray-200"
              >
                Kembali
              </Link>
            </div>

            <div className="mt-4 text-xs text-gray-400">
              Catatan: demi keamanan dan privasi, transparansi dilakukan lewat tx hash + log kategori (bukan membuka detail finansial pribadi).
            </div>
          </div>

          <div className="rounded-xl border border-terminal-border bg-terminal-panel p-5 md:col-span-2">
            <div className="text-sm font-semibold">Alokasi Donasi</div>
            <div className="mt-2 grid gap-2 text-sm text-gray-200 sm:grid-cols-3">
              <div className="rounded-lg border border-terminal-border bg-terminal-bg p-3">
                <div className="font-semibold">40%</div>
                <div className="mt-1 text-xs text-gray-400">Project &amp; Server</div>
              </div>
              <div className="rounded-lg border border-terminal-border bg-terminal-bg p-3">
                <div className="font-semibold">30%</div>
                <div className="mt-1 text-xs text-gray-400">Social Donation</div>
              </div>
              <div className="rounded-lg border border-terminal-border bg-terminal-bg p-3">
                <div className="font-semibold">30%</div>
                <div className="mt-1 text-xs text-gray-400">Developer Support</div>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-8 rounded-xl border border-terminal-border bg-terminal-panel p-5">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div>
              <div className="text-sm font-semibold">Donation & Spending Log</div>
              <div className="mt-1 text-xs text-gray-400">
                Log disimpan di MongoDB dan dipublikasikan per periode.
              </div>
            </div>
            <a
              href="/api/donation-logs/latest"
              className="rounded-md border border-terminal-border px-3 py-2 text-xs text-gray-200"
            >
              Lihat log terbaru (JSON)
            </a>
          </div>

          {latest ? (
            <div className="mt-4 text-sm text-gray-200">
              <div>
                <span className="text-gray-400">Periode:</span> {latest.period}
              </div>
              <div className="mt-1">
                <span className="text-gray-400">Terakhir diperbarui:</span>{' '}
                {latest.updatedAt ? new Date(latest.updatedAt).toLocaleString() : '-'}
              </div>
            </div>
          ) : (
            <div className="mt-4 text-sm text-gray-400">
              Belum ada log yang dipublikasikan.
            </div>
          )}

        </div>
      </div>
    </main>
  );
}
