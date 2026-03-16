import { NextResponse } from 'next/server';

// NOTE: Next.js route segment config exports must be statically analyzable.
// Keep this as a literal number to satisfy Vercel/Next build.
export const revalidate = 3600; // 1 hour (Next.js route segment cache)

type ExchangeInfoSpot = {
  symbols: Array<{ symbol: string; status: string; baseAsset: string; quoteAsset: string }>;
};

type ExchangeInfoFutures = {
  symbols: Array<{ symbol: string; status: string; baseAsset: string; quoteAsset: string }>;
};

async function safeFetchJson<T>(url: string): Promise<T> {
  const res = await fetch(url, {
    // edge/server cache (plus revalidate above)
  next: { revalidate: 3600 },
    headers: {
      'accept': 'application/json',
      'user-agent': 'QuantumTerminal/heatmap',
    },
  });

  if (!res.ok) {
    const text = await res.text().catch(() => '');
    throw new Error(`HTTP ${res.status} from ${url}${text ? `: ${text.slice(0, 200)}` : ''}`);
  }

  return res.json() as Promise<T>;
}

export async function GET() {
  try {
    // Prefer futures metadata (aligns with our heatmap futures-first feed)
    const futUrl = 'https://fapi.binance.com/fapi/v1/exchangeInfo';
    const spotUrl = 'https://api.binance.com/api/v3/exchangeInfo';

    let source: 'futures' | 'spot' = 'futures';
    let data: ExchangeInfoFutures | ExchangeInfoSpot;

    try {
      data = await safeFetchJson<ExchangeInfoFutures>(futUrl);
    } catch {
      source = 'spot';
      data = await safeFetchJson<ExchangeInfoSpot>(spotUrl);
    }

    // Keep only actively trading USDT pairs (fast + relevant for heatmap)
    const symbols = data.symbols
      .filter((s) => s.status === 'TRADING')
      .filter((s) => s.quoteAsset === 'USDT')
      .map((s) => ({
        symbol: s.symbol,
        baseAsset: s.baseAsset,
        quoteAsset: s.quoteAsset,
      }))
      .sort((a, b) => a.symbol.localeCompare(b.symbol));

    return NextResponse.json({ success: true, source, symbols });
  } catch (e: any) {
    return NextResponse.json(
      {
        success: false,
        error: e?.message ?? 'Failed to fetch Binance symbol list',
      },
      { status: 500 },
    );
  }
}
