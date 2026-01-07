import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';
// Next route segment config must be a literal value (not an expression).
export const revalidate = 21600; // 6 hours

export async function GET() {
  try {
    const response = await fetch('https://api.coingecko.com/api/v3/coins/list?include_platform=false', {
      headers: { Accept: 'application/json' },
      next: { revalidate },
    });

    if (!response.ok) {
      throw new Error('Failed to fetch coin list');
    }

    const data = (await response.json()) as Array<{ id: string; symbol: string; name: string }>;

    return NextResponse.json({ success: true, coins: data });
  } catch (error) {
    console.error('Error fetching coin list:', error);
    return NextResponse.json({ success: false, error: 'Failed to fetch coin list' }, { status: 500 });
  }
}
