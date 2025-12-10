import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';
export const revalidate = 300; // 5 minutes

export async function GET() {
  try {
    // For demonstration purposes, we'll simulate exchange inflow data
    // In a real implementation, you would fetch from APIs like:
    // - Glassnode (requires API key)
    // - Santiment (requires API key)
    // - CryptoQuant (requires API key)
    // - On-chain data analysis

    // Simulate realistic exchange inflow data
    const baseInflow = 2500000000; // $2.5B base
    const variation = Math.random() * 1000000000 - 500000000; // ±$0.5B variation
    const totalInflow = Math.max(500000000, baseInflow + variation); // Minimum $500M

    // Calculate inflow change (simulated)
    const changePercent = (Math.random() - 0.5) * 20; // ±10% change

    // Major exchanges inflow breakdown (simulated)
    const exchanges = [
      { name: 'Binance', inflow: totalInflow * 0.25, change: changePercent + Math.random() * 5 },
      { name: 'Coinbase', inflow: totalInflow * 0.18, change: changePercent - Math.random() * 3 },
      { name: 'Kraken', inflow: totalInflow * 0.12, change: changePercent + Math.random() * 2 },
      { name: 'Gate.io', inflow: totalInflow * 0.08, change: changePercent - Math.random() * 4 },
      { name: 'Others', inflow: totalInflow * 0.37, change: changePercent + Math.random() * 1 }
    ];

    // Top coins inflow (simulated based on market cap)
    const topCoins = [
      { symbol: 'BTC', inflow: totalInflow * 0.45, change: changePercent + Math.random() * 8 },
      { symbol: 'ETH', inflow: totalInflow * 0.25, change: changePercent - Math.random() * 5 },
      { symbol: 'USDT', inflow: totalInflow * 0.15, change: changePercent + Math.random() * 3 },
      { symbol: 'BNB', inflow: totalInflow * 0.08, change: changePercent + Math.random() * 6 },
      { symbol: 'Others', inflow: totalInflow * 0.07, change: changePercent - Math.random() * 2 }
    ];

    return NextResponse.json({
      totalInflow,
      change24h: changePercent,
      exchanges,
      topCoins,
      lastUpdated: new Date().toISOString(),
      note: "Data simulated for demonstration. Use real APIs for production."
    });

  } catch (error) {
    console.error('Error fetching exchange inflow data:', error);

    // Fallback data
    return NextResponse.json({
      totalInflow: 2750000000,
      change24h: 5.2,
      exchanges: [
        { name: 'Binance', inflow: 687500000, change: 3.1 },
        { name: 'Coinbase', inflow: 495000000, change: 2.8 },
        { name: 'Kraken', inflow: 330000000, change: -1.2 },
        { name: 'Gate.io', inflow: 220000000, change: 4.5 },
        { name: 'Others', inflow: 1017500000, change: 1.9 }
      ],
      topCoins: [
        { symbol: 'BTC', inflow: 1237500000, change: 7.2 },
        { symbol: 'ETH', inflow: 687500000, change: -2.1 },
        { symbol: 'USDT', inflow: 412500000, change: 3.8 },
        { symbol: 'BNB', inflow: 220000000, change: 5.9 },
        { symbol: 'Others', inflow: 192500000, change: -0.8 }
      ],
      lastUpdated: new Date().toISOString(),
      note: "Fallback data - API unavailable"
    });
  }
}