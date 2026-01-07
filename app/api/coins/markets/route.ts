import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';
export const revalidate = 60;

const COINGECKO_BASE = 'https://api.coingecko.com/api/v3';

function parseIdsParam(idsParam: string | null): string[] {
  if (!idsParam) return [];
  return idsParam
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean)
    .slice(0, 30);
}

// GET /api/coins/markets?ids=bitcoin,ethereum&vs_currency=usd
// Returns a subset of CoinGecko /coins/markets.
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const ids = parseIdsParam(searchParams.get('ids'));
    const vsCurrency = (searchParams.get('vs_currency') || 'usd').toLowerCase();

    if (ids.length === 0) {
      return NextResponse.json({ success: true, data: [] });
    }

    const url = `${COINGECKO_BASE}/coins/markets?vs_currency=${encodeURIComponent(vsCurrency)}&ids=${encodeURIComponent(
      ids.join(',')
    )}&order=market_cap_desc&per_page=${ids.length}&page=1&sparkline=false&price_change_percentage=24h`;

    const response = await fetch(url, {
      headers: { Accept: 'application/json' },
      next: { revalidate: 60 },
    });

    if (!response.ok) {
      return NextResponse.json(
        { success: false, error: 'Failed to fetch market data' },
        { status: response.status }
      );
    }

    const data = await response.json();
    return NextResponse.json({ success: true, data, timestamp: new Date().toISOString() });
  } catch (error) {
    console.error('Error fetching coin markets:', error);
    return NextResponse.json({ success: false, error: 'Failed to fetch market data' }, { status: 500 });
  }
}
