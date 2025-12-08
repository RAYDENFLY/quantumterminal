import { NextResponse } from 'next/server';

export async function GET() {
  try {
    const response = await fetch('https://api.llama.fi/chains', {
      next: { revalidate: 300 } // Cache for 5 minutes
    });

    if (!response.ok) {
      throw new Error('Failed to fetch TVL data');
    }

    const data = await response.json();
    const topChains = data
      .sort((a: any, b: any) => b.tvl - a.tvl)
      .slice(0, 5)
      .map((chain: any) => ({
        name: chain.name,
        tvl: chain.tvl
      }));

    return NextResponse.json(topChains);
  } catch (error) {
    console.error('Error fetching TVL data:', error);
    return NextResponse.json(
      { error: 'Failed to fetch TVL data' },
      { status: 500 }
    );
  }
}