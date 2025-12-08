import { NextResponse } from 'next/server';

export async function GET() {
  try {
    const [heightRes, totalRes, hashRes] = await Promise.all([
      fetch('https://blockchain.info/q/getblockcount', {
        next: { revalidate: 60 }
      }),
      fetch('https://blockchain.info/q/totalbc', {
        next: { revalidate: 3600 } // Cache for 1 hour
      }),
      fetch('https://blockchain.info/q/hashrate', {
        next: { revalidate: 60 }
      })
    ]);

    if (!heightRes.ok || !totalRes.ok || !hashRes.ok) {
      throw new Error('Failed to fetch Bitcoin stats');
    }

    const height = await heightRes.text();
    const total = await totalRes.text();
    const hashrate = await hashRes.text();

    const data = {
      blockHeight: parseInt(height),
      totalBTC: (parseInt(total) / 100000000).toFixed(2),
      hashRate: (parseInt(hashrate) / 1e18).toFixed(2)
    };

    return NextResponse.json(data);
  } catch (error) {
    console.error('Error fetching Bitcoin stats:', error);
    return NextResponse.json(
      { error: 'Failed to fetch Bitcoin stats' },
      { status: 500 }
    );
  }
}