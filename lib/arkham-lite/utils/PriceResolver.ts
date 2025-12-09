import { PriceData } from '../types';

export class PriceResolver {
  private priceCache: Map<string, { price: number; timestamp: number }>;
  private readonly CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

  constructor() {
    this.priceCache = new Map();
  }

  async getTokenPrice(tokenAddress: string, chain: string = 'ethereum'): Promise<number | null> {
    const cacheKey = `${chain}_${tokenAddress.toLowerCase()}`;

    // Check cache first
    const cached = this.priceCache.get(cacheKey);
    if (cached && Date.now() - cached.timestamp < this.CACHE_DURATION) {
      return cached.price;
    }

    try {
      // Try CoinGecko API first
      const price = await this.fetchFromCoinGecko(tokenAddress, chain);
      if (price !== null) {
        this.priceCache.set(cacheKey, { price, timestamp: Date.now() });
        return price;
      }

      // Fallback to DEX price estimation
      const dexPrice = await this.fetchFromDEX(tokenAddress, chain);
      if (dexPrice !== null) {
        this.priceCache.set(cacheKey, { price: dexPrice, timestamp: Date.now() });
        return dexPrice;
      }
    } catch (error) {
      console.error('Failed to fetch price for token:', tokenAddress, error);
    }

    return null;
  }

  private async fetchFromCoinGecko(tokenAddress: string, chain: string): Promise<number | null> {
    // Map chain names to CoinGecko platform IDs
    const platformMap: Record<string, string> = {
      ethereum: 'ethereum',
      arbitrum: 'arbitrum-one',
      base: 'base'
    };

    const platform = platformMap[chain];
    if (!platform) return null;

    try {
      const response = await fetch(
        `https://api.coingecko.com/api/v3/simple/token_price/${platform}?contract_addresses=${tokenAddress}&vs_currencies=usd`
      );

      if (!response.ok) return null;

      const data = await response.json();
      const tokenData = data[tokenAddress.toLowerCase()];

      return tokenData?.usd || null;
    } catch (error) {
      console.error('CoinGecko API error:', error);
      return null;
    }
  }

  private async fetchFromDEX(tokenAddress: string, chain: string): Promise<number | null> {
    // This is a simplified DEX price estimation
    // In production, you'd integrate with The Graph or direct DEX contracts

    try {
      // For now, return null - this would need actual DEX integration
      // You could implement Uniswap V2/V3 price fetching here
      return null;
    } catch (error) {
      console.error('DEX price fetch error:', error);
      return null;
    }
  }

  async getBatchPrices(tokenAddresses: string[], chain: string = 'ethereum'): Promise<Record<string, number | null>> {
    const results: Record<string, number | null> = {};

    // Process in batches to respect API rate limits
    const batchSize = 50; // CoinGecko allows up to 50 contracts per request
    for (let i = 0; i < tokenAddresses.length; i += batchSize) {
      const batch = tokenAddresses.slice(i, i + batchSize);
      const batchPromises = batch.map(addr => this.getTokenPrice(addr, chain));
      const batchResults = await Promise.all(batchPromises);

      batch.forEach((addr, index) => {
        results[addr] = batchResults[index];
      });

      // Small delay between batches
      if (i + batchSize < tokenAddresses.length) {
        await new Promise(resolve => setTimeout(resolve, 1000)); // 1 second delay
      }
    }

    return results;
  }

  async getPriceData(tokenAddress: string, symbol: string, chain: string = 'ethereum'): Promise<PriceData | null> {
    const price = await this.getTokenPrice(tokenAddress, chain);
    if (price === null) return null;

    return {
      tokenAddress: tokenAddress.toLowerCase(),
      symbol,
      price,
      timestamp: Date.now(),
      source: 'coingecko' // or 'dex' depending on where it came from
    };
  }

  clearCache(): void {
    this.priceCache.clear();
  }

  // Get cache stats for monitoring
  getCacheStats(): { size: number; oldest: number | null; newest: number | null } {
    if (this.priceCache.size === 0) {
      return { size: 0, oldest: null, newest: null };
    }

    const timestamps = Array.from(this.priceCache.values()).map(entry => entry.timestamp);
    return {
      size: this.priceCache.size,
      oldest: Math.min(...timestamps),
      newest: Math.max(...timestamps)
    };
  }
}