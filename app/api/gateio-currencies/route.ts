import { NextResponse } from 'next/server';

export async function GET() {
  try {
    // Fetch currency information
    const currenciesResponse = await fetch('https://api.gateio.ws/api/v4/spot/currencies', {
      headers: {
        'Accept': 'application/json',
      },
    });

    if (!currenciesResponse.ok) {
      throw new Error(`Gate.io currencies API error: ${currenciesResponse.status}`);
    }

    const currenciesData = await currenciesResponse.json();

    // Fetch ticker prices
    const tickersResponse = await fetch('https://api.gateio.ws/api/v4/spot/tickers', {
      headers: {
        'Accept': 'application/json',
      },
    });

    if (!tickersResponse.ok) {
      throw new Error(`Gate.io tickers API error: ${tickersResponse.status}`);
    }

    const tickersData = await tickersResponse.json();

    // Filter for major cryptocurrencies
    const majorCoins = ['BTC', 'ETH', 'BNB', 'ADA', 'SOL', 'DOT', 'DOGE', 'AVAX', 'LTC', 'MATIC'];

    // Create a map of ticker data for quick lookup
    const tickerMap = new Map();
    tickersData.forEach((ticker: any) => {
      const symbol = ticker.currency_pair.split('_')[0];
      if (majorCoins.includes(symbol)) {
        tickerMap.set(symbol, {
          last: parseFloat(ticker.last),
          change_percentage: parseFloat(ticker.change_percentage),
          high_24h: parseFloat(ticker.high_24h),
          low_24h: parseFloat(ticker.low_24h),
          volume: parseFloat(ticker.base_volume),
        });
      }
    });

    // Combine currency info with price data
    const combinedData = currenciesData
      .filter((coin: any) => majorCoins.includes(coin.currency))
      .map((coin: any) => {
        const priceData = tickerMap.get(coin.currency);
        return {
          symbol: coin.currency,
          name: coin.name,
          chain: coin.chain,
          trade_disabled: coin.trade_disabled,
          withdraw_disabled: coin.withdraw_disabled,
          deposit_disabled: coin.deposit_disabled,
          price: priceData?.last || 0,
          change_percentage: priceData?.change_percentage || 0,
          high_24h: priceData?.high_24h || 0,
          low_24h: priceData?.low_24h || 0,
          volume: priceData?.volume || 0,
        };
      });

    return NextResponse.json({
      success: true,
      data: combinedData,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Error fetching Gate.io data:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch currency and price data' },
      { status: 500 }
    );
  }
}