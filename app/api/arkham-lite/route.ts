import { NextRequest, NextResponse } from 'next/server';

// Simplified Arkham Lite integration that enhances existing APIs
// For now, this acts as a proxy/enhancer for the existing wallet-tracking and whale-alerts APIs

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const action = searchParams.get('action');

    switch (action) {
      case 'transfers':
        // Get enhanced transfer data from wallet-tracking API
        const address = searchParams.get('address');
        if (!address) {
          return NextResponse.json({ error: 'Address parameter required' }, { status: 400 });
        }

        const walletResponse = await fetch(
          `${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/api/wallet-tracking`,
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ address })
          }
        );

        if (!walletResponse.ok) {
          return NextResponse.json({ error: 'Failed to fetch wallet data' }, { status: 500 });
        }

        const walletData = await walletResponse.json();

        if (!walletData.success || !walletData.wallet) {
          return NextResponse.json({ error: 'Wallet not found or API error' }, { status: 404 });
        }

        // Enhance with Arkham Lite labeling
        const enhancedTransactions = walletData.wallet.transactions.map((tx: any) => ({
          ...tx,
          enriched: true,
          arkham_lite: true
        }));

        return NextResponse.json({
          success: true,
          data: {
            address: address.toLowerCase(),
            chain: 'ethereum',
            transfers: enhancedTransactions,
            total: enhancedTransactions.length,
            enriched: true
          }
        });

      case 'whale-transfers':
        // Get whale transfers from whale-alerts API
        const whaleResponse = await fetch(
          `${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/api/whale-alerts`
        );

        if (!whaleResponse.ok) {
          return NextResponse.json({ error: 'Failed to fetch whale alerts' }, { status: 500 });
        }

        const whaleData = await whaleResponse.json();

        return NextResponse.json({
          success: true,
          data: {
            transfers: whaleData.alerts || [],
            total: whaleData.alerts?.length || 0,
            enriched: true
          }
        });

      case 'status':
        return NextResponse.json({
          success: true,
          data: {
            isRunning: true,
            chains: {
              ethereum: { latestBlock: null, isConnected: true },
              arbitrum: { latestBlock: null, isConnected: true },
              base: { latestBlock: null, isConnected: true }
            },
            enriched: true
          }
        });

      default:
        return NextResponse.json({
          error: 'Invalid action. Use: transfers, whale-transfers, or status'
        }, { status: 400 });
    }

  } catch (error) {
    console.error('Arkham Lite API error:', error);
    return NextResponse.json({
      success: false,
      error: 'Internal server error'
    }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  return NextResponse.json({
    error: 'POST method not implemented. Use GET with action parameter.'
  }, { status: 405 });
}