'use client';

import useSWR from 'swr';
import Image from 'next/image';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faArrowUp, faArrowDown } from '@fortawesome/free-solid-svg-icons';

const fetcher = (url: string) => fetch(url).then((r) => r.json());

export type CoinTag = {
  coinId: string;
  symbol: string;
  name: string;
  image?: string;
};

type MarketCoin = {
  id: string;
  symbol: string;
  name: string;
  image: string;
  current_price: number;
  price_change_percentage_24h: number;
};

function formatPrice(price: number) {
  if (!Number.isFinite(price)) return '-';
  if (price >= 1) return `$${price.toFixed(2)}`;
  return `$${price.toFixed(6)}`;
}

export default function CoinTagChips({ tags }: { tags: CoinTag[] }) {
  const ids = tags.map((t) => t.coinId).filter(Boolean);

  const url = ids.length ? `/api/coins/markets?ids=${encodeURIComponent(ids.join(','))}&vs_currency=usd` : null;
  const { data } = useSWR(url, fetcher, { refreshInterval: 60000 });

  const market: MarketCoin[] = Array.isArray(data?.data) ? data.data : [];
  const byId = new Map(market.map((c) => [c.id, c] as const));

  return (
    <div className="mt-2 flex flex-wrap gap-2">
      {tags.map((t) => {
        const m = byId.get(t.coinId);
        const img = m?.image || t.image || '';
        const pct = typeof m?.price_change_percentage_24h === 'number' ? m.price_change_percentage_24h : null;
        const up = pct !== null ? pct >= 0 : null;

        return (
          <span
            key={t.coinId}
            className="inline-flex items-center gap-2 rounded-full border border-terminal-border bg-terminal-bg px-2 py-1 text-xs"
            title={t.name}
          >
            {img ? <Image src={img} alt={t.name} width={16} height={16} className="rounded-full" /> : null}
            <span className="font-semibold text-gray-200">{String(t.symbol || '').toUpperCase()}</span>

            {m ? (
              <>
                <span className="font-mono text-[11px] text-gray-300">{formatPrice(m.current_price)}</span>
                {pct !== null ? (
                  <span
                    className={`inline-flex items-center gap-1 font-mono text-[11px] ${
                      up ? 'text-terminal-success' : 'text-terminal-danger'
                    }`}
                  >
                    <FontAwesomeIcon icon={up ? faArrowUp : faArrowDown} className="h-3 w-3" />
                    <span>{up ? '+' : ''}{pct.toFixed(2)}%</span>
                  </span>
                ) : null}
              </>
            ) : null}
          </span>
        );
      })}
    </div>
  );
}
