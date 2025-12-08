import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';
export const revalidate = 60;

export async function GET() {
  try {
    const response = await fetch(
      'https://api.coingecko.com/api/v3/coins/markets?vs_currency=usd&order=market_cap_desc&per_page=100&page=1&sparkline=false&price_change_percentage=24h',
      {
        headers: {
          'Accept': 'application/json',
        },
        next: { revalidate: 60 }
      }
    );

    if (!response.ok) {
      throw new Error('Failed to fetch top gainers');
    }

    const data = await response.json();
    
    // Sort by price change percentage (highest first)
    const gainers = data
      .filter((coin: any) => coin.price_change_percentage_24h > 0)
      .sort((a: any, b: any) => b.price_change_percentage_24h - a.price_change_percentage_24h)
      .slice(0, 10);

    return NextResponse.json(gainers);
  } catch (error) {
    console.error('Error fetching top gainers:', error);
    return NextResponse.json(
      { error: 'Failed to fetch top gainers' },
      { status: 500 }
    );
  }
}
