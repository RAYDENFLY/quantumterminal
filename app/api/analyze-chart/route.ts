import { NextRequest, NextResponse } from 'next/server';
import { analyzeChartData } from '@/lib/groq';

// Helper to format date
const formatDate = (timestamp: number) => new Date(timestamp).toLocaleDateString() + ' ' + new Date(timestamp).toLocaleTimeString();

// Simple mapping for common tickers to CoinGecko IDs
const TICKER_MAP: Record<string, string> = {
    'BTC': 'bitcoin',
    'ETH': 'ethereum',
    'SOL': 'solana',
    'XRP': 'ripple',
    'DOGE': 'dogecoin',
    'ADA': 'cardano',
    'BNB': 'binancecoin',
    'DOT': 'polkadot',
    'MATIC': 'matic-network',
    'LINK': 'chainlink',
    'AVAX': 'avalanche-2',
    'LTC': 'litecoin',
    'UNI': 'uniswap',
    'ATOM': 'cosmos',
    'NEAR': 'near',
    'APT': 'aptos',
    'ARB': 'arbitrum',
    'OP': 'optimism',
    'SUI': 'sui'
};

export async function POST(req: NextRequest) {
    try {
        const { timeFrame = '1H', ticker = 'BTC' } = await req.json();

        const normalizedTicker = ticker.toUpperCase();
        // Use mapped ID or fallback to lowercase ticker (best effort)
        let coinId = TICKER_MAP[normalizedTicker];

        // If not in map, try to search for it
        if (!coinId) {
            try {
                const searchRes = await fetch(`https://api.coingecko.com/api/v3/search?query=${encodeURIComponent(normalizedTicker)}`);
                const searchData = await searchRes.json();

                // Get the first coin that matches the symbol exactly or is the top result
                const validCoin = searchData.coins?.find((c: any) => c.symbol.toUpperCase() === normalizedTicker) || searchData.coins?.[0];

                if (validCoin) {
                    coinId = validCoin.id;
                } else {
                    // Fallback to simple lowercase if completely failed
                    coinId = normalizedTicker.toLowerCase();
                }
            } catch (err) {
                console.warn('Coin search failed, falling back to lowercase:', err);
                coinId = normalizedTicker.toLowerCase();
            }
        }

        // Mapping TimeFrame to CoinGecko 'days' parameter
        let days = '1';
        switch (timeFrame) {
            case '15m':
            case '1H':
                days = '1';
                break;
            case '4H':
                days = '7';
                break;
            case '1D':
                days = '30';
                break;
            default:
                days = '1';
        }

        // 1. Fetch OHLCV Data from CoinGecko
        const coingeckoUrl = `https://api.coingecko.com/api/v3/coins/${coinId}/ohlc?vs_currency=usd&days=${days}`;

        const response = await fetch(coingeckoUrl);
        if (!response.ok) {
            if (response.status === 404) {
                return NextResponse.json(
                    { success: false, error: `Coin '${ticker}' (${coinId}) not found. Please verify the ticker.` },
                    { status: 404 }
                );
            }
            return NextResponse.json(
                { success: false, error: 'Failed to fetch market data from CoinGecko' },
                { status: response.status }
            );
        }

        const data: [number, number, number, number, number][] = await response.json();

        // 2. Process Data (Take last 50 candles for better context)
        if (!data || data.length === 0) {
            return NextResponse.json({ success: false, error: 'No data available' }, { status: 404 });
        }

        const recentData = data.slice(-50);

        // 3. Format to String for LLM
        const formattedData = recentData.map(([time, open, high, low, close]) => {
            return `Time: ${formatDate(time)}, Open: ${open}, High: ${high}, Low: ${low}, Close: ${close}`;
        }).join('\n');

        // 4. Call Groq with TimeFrame context and Ticker
        const analysis = await analyzeChartData(formattedData, timeFrame, normalizedTicker);

        return NextResponse.json({ success: true, analysis });

    } catch (error: any) {
        console.error('Analysis Error:', error);
        return NextResponse.json(
            { success: false, error: error.message || 'Internal Server Error' },
            { status: 500 }
        );
    }
}
