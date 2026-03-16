'use client';

type Props = {
  show: boolean;
};

export default function DisconnectedAlert({ show }: Props) {
  if (!show) return null;

  return (
    <div className="rounded-lg border border-red-500/40 bg-red-500/8 px-4 py-3.5 space-y-2.5">
      {/* title */}
      <div className="flex items-center gap-2">
        <span className="text-red-400 text-base leading-none">⚠</span>
        <span className="text-[13px] font-bold text-red-300">Warning: data feed disconnected</span>
      </div>

      {/* body EN */}
      <p className="text-[12px] text-gray-300 leading-relaxed">
        Market data is currently unavailable — orderflow and microstructure signals will not update.
      </p>
      <p className="text-[12px] text-gray-400 leading-relaxed">
        <span className="font-semibold text-gray-300">If your region blocks exchange endpoints:</span>{' '}
        try using a VPN or switching DNS —{' '}
        <span className="font-mono text-sky-400">AdGuard DNS: dns.adguard.com</span> or{' '}
        <span className="font-mono text-sky-400">Cloudflare: 1.1.1.1</span>.
      </p>
      <p className="text-[12px] text-yellow-400/80 leading-relaxed">
        <span className="font-semibold">⚡ On Vercel:</span>{' '}
        VPN or DNS changes on your device won&#39;t affect the server&#39;s region or IP.
        You may need to <span className="text-yellow-300 font-semibold">deploy in another region</span> or{' '}
        route requests through an <span className="text-yellow-300 font-semibold">upstream proxy / mirror</span>.
      </p>

      {/* divider */}
      <div className="border-t border-white/8 pt-2 space-y-1">
        {/* body ID */}
        <p className="text-[11px] text-gray-500 leading-relaxed">
          <span className="font-semibold text-gray-400">ID —</span>{' '}
          Data market sedang tidak tersedia — sinyal orderflow dan microstructure tidak akan diperbarui.
        </p>
        <p className="text-[11px] text-gray-500 leading-relaxed">
          Jika region kamu memblokir endpoint exchange, coba gunakan VPN atau ganti DNS —{' '}
          <span className="font-mono text-sky-500/80">AdGuard: dns.adguard.com</span> atau{' '}
          <span className="font-mono text-sky-500/80">Cloudflare: 1.1.1.1</span>.
        </p>
        <p className="text-[11px] text-yellow-500/60 leading-relaxed">
          Di Vercel, VPN/DNS di perangkatmu tidak mengubah region/IP server. Kamu mungkin perlu
          deploy di region lain atau routing request lewat proxy/mirror.
        </p>
      </div>
    </div>
  );
}
