import { NextRequest, NextResponse } from 'next/server';

// In-memory storage for tracked wallets (in production, use database)
let trackedWallets: Array<{
  address: string;
  label: string;
  type: string;
  addedAt: string;
}> = [
  {
    address: '0xDBF5E9c5206d0dB70a90108bf936DA60221dC080',
    label: 'Wintermute',
    type: 'market-maker',
    addedAt: new Date().toISOString()
  },
  {
    address: '0x573ca9FF6b7f164dfF513077850d5CD796006fF4',
    label: 'Aster',
    type: 'market-maker',
    addedAt: new Date().toISOString()
  }
];

// Simple cache for DeBank API responses
const debankCache = new Map<string, { data: any; timestamp: number }>();
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

// Cache for Arkham Lite data
const arkhamCache = new Map<string, { data: any; timestamp: number }>();
const ARKHAM_CACHE_DURATION = 2 * 60 * 1000; // 2 minutes

// Rate limiting
let lastRequestTime = 0;
const MIN_REQUEST_INTERVAL = 1000; // 1 second between requests

// Real API functions using DeBank OpenAPI (free tier)
async function getDeBankWalletInfo(address: string) {
  try {
    const DEBANK_API_KEY = process.env.DEBANK_API_KEY;

    if (!DEBANK_API_KEY) {
      console.warn('DEBANK_API_KEY not configured');
      return null;
    }

    // Check cache first
    const cacheKey = `debank_${address}`;
    const cached = debankCache.get(cacheKey);
    if (cached && (Date.now() - cached.timestamp) < CACHE_DURATION) {
      return cached.data;
    }

    // Rate limiting
    const now = Date.now();
    const timeSinceLastRequest = now - lastRequestTime;
    if (timeSinceLastRequest < MIN_REQUEST_INTERVAL) {
      await new Promise(resolve => setTimeout(resolve, MIN_REQUEST_INTERVAL - timeSinceLastRequest));
    }
    lastRequestTime = Date.now();

    // Get portfolio value
    const portfolioResponse = await fetch(
      `https://api.debank.com/user/total_balance?id=${address}`,
      {
        headers: {
          'Accept': 'application/json',
          'AccessKey': DEBANK_API_KEY
        }
      }
    );

    if (portfolioResponse.status === 429) {
      console.warn('DeBank API rate limited, using cached data if available');
      return cached?.data || null;
    }

    if (!portfolioResponse.ok) {
      throw new Error(`DeBank API error: ${portfolioResponse.status}`);
    }

    const portfolio = await portfolioResponse.json();

    // Rate limiting delay
    await new Promise(resolve => setTimeout(resolve, 500));

    // Get token holdings
    const tokensResponse = await fetch(
      `https://api.debank.com/user/token_list?id=${address}&is_all=false`,
      {
        headers: {
          'Accept': 'application/json',
          'AccessKey': DEBANK_API_KEY
        }
      }
    );

    const tokens = tokensResponse.ok ? await tokensResponse.json() : [];

    // Rate limiting delay
    await new Promise(resolve => setTimeout(resolve, 500));

    // Get DeFi positions
    const defiResponse = await fetch(
      `https://api.debank.com/user/complex_protocol_list?id=${address}`,
      {
        headers: {
          'Accept': 'application/json',
          'AccessKey': DEBANK_API_KEY
        }
      }
    );

    const defi = defiResponse.ok ? await defiResponse.json() : [];

    const result = {
      address: address.toLowerCase(),
      balance: portfolio.total_usd_value?.toString() || '0',
      totalValue: portfolio.total_usd_value || 0,
      tokens: tokens.filter((t: any) => t.amount > 0),
      defi_positions: defi,
      lastActivity: new Date().toISOString(),
      transactions: [] // We'll implement transaction fetching separately
    };

    // Cache the result
    debankCache.set(cacheKey, { data: result, timestamp: Date.now() });

    return result;
  } catch (error) {
    console.error('Failed to fetch DeBank data:', error);
    return null;
  }
}

// Get recent transactions using Covalent API (free tier)
async function getCovalentTransactions(address: string, limit = 10) {
  try {
    const COVALENT_API_KEY = process.env.COVALENT_API_KEY;

    if (!COVALENT_API_KEY) {
      console.warn('COVALENT_API_KEY not configured');
      return [];
    }

    const response = await fetch(
      `https://api.covalenthq.com/v1/eth-mainnet/address/${address}/transactions_v2/?key=${COVALENT_API_KEY}&page-size=${limit}`,
      {
        headers: {
          'Accept': 'application/json'
        }
      }
    );

    if (!response.ok) {
      throw new Error(`Covalent API error: ${response.status}`);
    }

    const data = await response.json();

    return data.data?.items?.map((tx: any) => ({
      hash: tx.tx_hash,
      from: tx.from_address,
      to: tx.to_address,
      value: tx.value?.toString() || '0',
      timestamp: tx.block_signed_at,
      blockNumber: tx.block_height,
      gasUsed: tx.gas_spent?.toString(),
      gasPrice: tx.gas_price?.toString(),
      tokenSymbol: 'ETH',
      type: tx.from_address.toLowerCase() === address.toLowerCase() ? 'transfer' : 'receive',
      chain: 'ethereum'
    })) || [];
  } catch (error) {
    console.error('Failed to fetch Covalent transactions:', error);
    return [];
  }
}

// Get Arkham Lite transfer data for enhanced transaction tracking
async function getArkhamLiteTransfers(address: string, limit = 20) {
  try {
    const cacheKey = `arkham_${address}_${limit}`;
    const cached = arkhamCache.get(cacheKey);

    if (cached && (Date.now() - cached.timestamp) < ARKHAM_CACHE_DURATION) {
      return cached.data;
    }

    // Fetch from Arkham Lite API
    const response = await fetch(
      `${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/api/arkham-lite?action=transfers&address=${address}&limit=${limit}`
    );

    if (!response.ok) {
      console.warn('Arkham Lite API not available, falling back to Covalent');
      return null;
    }

    const arkhamData = await response.json();

    if (!arkhamData.success) {
      console.warn('Arkham Lite API returned error:', arkhamData.error);
      return null;
    }

    // Transform Arkham Lite data to match our format
    const transfers = arkhamData.data.transfers.map((transfer: any) => ({
      hash: transfer.tx_hash,
      from: transfer.from,
      to: transfer.to,
      value: (transfer.amount * Math.pow(10, 18)).toString(), // Convert back to wei for consistency
      timestamp: transfer.timestamp,
      blockNumber: transfer.block_number,
      tokenSymbol: transfer.token_symbol,
      usdValue: transfer.usd_value,
      type: transfer.from.toLowerCase() === address.toLowerCase() ? 'transfer' : 'receive',
      chain: transfer.chain,
      enriched: true // Mark as enriched with Arkham Lite data
    }));

    const result = {
      transfers,
      total: arkhamData.data.total,
      enriched: true
    };

    // Cache the result
    arkhamCache.set(cacheKey, { data: result, timestamp: Date.now() });

    return result;
  } catch (error) {
    console.error('Failed to fetch Arkham Lite transfers:', error);
    return null;
  }
}

// Classify wallet type based on various heuristics
function classifyWalletType(address: string, balance: number, transactions: any[]) {
  // Known exchange addresses (partial list)
  const exchangeAddresses = [
    '0x28c6c06298d514db089934071355e5743bf21d60', // Binance
    '0xdfd5293d8e347dfe59e90efd55b2956a1343963d', // Binance
    '0xeb2d2f1b8c558a40207669291fda468e50c8a0bb', // Crypto.com
    '0x2910543af39aba0cd09dbb2d50200b3e800a63d2', // Kraken
    '0x5a52e96bacdabb82fd05763e25335261b270efcb', // Binance
  ];

  if (exchangeAddresses.includes(address.toLowerCase())) {
    return 'exchange';
  }

  // Whale classification based on balance
  if (balance > 10000000) { // $10M+
    return 'whale';
  }

  // High volume trader
  if (transactions.length > 100) {
    return 'trader';
  }

  // DeFi user
  if (balance > 10000 && transactions.some(tx => tx.type === 'swap' || tx.type === 'deposit')) {
    return 'defi';
  }

  return 'unknown';
}

export async function GET() {
  try {
    // Check if required APIs are configured
    const DEBANK_API_KEY = process.env.DEBANK_API_KEY;
    const COVALENT_API_KEY = process.env.COVALENT_API_KEY;
    const hasExternalAPIs = DEBANK_API_KEY && COVALENT_API_KEY;

    // Always show tracked wallets, even without external APIs
    // We'll use Arkham Lite data as fallback

    // If no wallets are manually tracked, auto-populate from recent whale alerts
    if (trackedWallets.length === 0) {
      try {
        const whaleResponse = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/api/whale-alerts`);
        if (whaleResponse.ok) {
          const whaleData = await whaleResponse.json();
          const uniqueAddresses = new Set<string>();

          // Get unique addresses from recent whale alerts
          whaleData.alerts?.slice(0, 5).forEach((alert: any) => {
            if (alert.address && alert.address.startsWith('0x')) {
              uniqueAddresses.add(alert.address);
            }
          });

          // Auto-add these wallets for tracking
          uniqueAddresses.forEach(address => {
            if (!trackedWallets.some(w => w.address.toLowerCase() === address.toLowerCase())) {
              trackedWallets.push({
                address,
                label: `Whale Wallet ${address.slice(0, 6)}...${address.slice(-4)}`,
                type: 'whale',
                addedAt: new Date().toISOString()
              });
            }
          });
        }
      } catch (error) {
        console.error('Failed to auto-populate wallets from whale alerts:', error);
      }
    }

    // Get all tracked wallets with real data or fallback mock data
    const wallets = await Promise.all(
      trackedWallets.map(async (wallet) => {
        const debankInfo = DEBANK_API_KEY ? await getDeBankWalletInfo(wallet.address) : null;
        const covalentTransactions = COVALENT_API_KEY ? await getCovalentTransactions(wallet.address, 5) : [];
        const arkhamData = await getArkhamLiteTransfers(wallet.address, 10);

        // Create mock data if APIs are not available
        const mockDebankInfo = {
          address: wallet.address.toLowerCase(),
          balance: '0',
          totalValue: 0,
          tokens: [],
          defi_positions: [],
          lastActivity: new Date().toISOString(),
          transactions: []
        };

        const finalDebankInfo = debankInfo || mockDebankInfo;

        // Use Arkham Lite data if available, otherwise fall back to Covalent or mock data
        const transactions = arkhamData?.enriched
          ? arkhamData.transfers.slice(0, 10)
          : covalentTransactions.length > 0 ? covalentTransactions : [];

        const walletType = classifyWalletType(wallet.address, finalDebankInfo.totalValue, transactions);

        return {
          address: wallet.address,
          label: wallet.label,
          balance: finalDebankInfo.balance,
          totalValue: finalDebankInfo.totalValue,
          lastActivity: finalDebankInfo.lastActivity,
          transactions,
          type: walletType,
          tokens: finalDebankInfo.tokens,
          defi_positions: finalDebankInfo.defi_positions
        };
      })
    );

    const validWallets = wallets.filter(w => w !== null);

    // Always return tracked wallets, even with mock data when APIs are unavailable
    return NextResponse.json({
      success: true,
      wallets: validWallets,
      apiStatus: {
        debank: !!DEBANK_API_KEY,
        covalent: !!COVALENT_API_KEY,
        arkhamLite: true // Always available as it proxies existing APIs
      },
      message: !hasExternalAPIs ? 'Using mock data - configure API keys for real data' : undefined
    });
  } catch (error) {
    console.error('Failed to fetch wallet data:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch wallet data', wallets: [] },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const { address } = await request.json();

    if (!address || !address.startsWith('0x') || address.length !== 42) {
      return NextResponse.json(
        { success: false, error: 'Invalid Ethereum address' },
        { status: 400 }
      );
    }

    // Check if wallet is already tracked
    if (trackedWallets.some(w => w.address.toLowerCase() === address.toLowerCase())) {
      return NextResponse.json(
        { success: false, error: 'Wallet already being tracked' },
        { status: 400 }
      );
    }

    // Check API availability
    const DEBANK_API_KEY = process.env.DEBANK_API_KEY;
    const COVALENT_API_KEY = process.env.COVALENT_API_KEY;

    // Fetch wallet data (use mock data if APIs not available)
    const debankInfo = DEBANK_API_KEY ? await getDeBankWalletInfo(address) : null;
    const covalentTransactions = COVALENT_API_KEY ? await getCovalentTransactions(address, 5) : [];
    const arkhamData = await getArkhamLiteTransfers(address, 10);

    // Create mock data if APIs are not available
    const mockDebankInfo = {
      address: address.toLowerCase(),
      balance: '0',
      totalValue: 0,
      tokens: [],
      defi_positions: [],
      lastActivity: new Date().toISOString(),
      transactions: []
    };

    const finalDebankInfo = debankInfo || mockDebankInfo;

    // Use Arkham Lite data if available, otherwise fall back to Covalent or mock data
    const transactions = arkhamData?.enriched
      ? arkhamData.transfers.slice(0, 10)
      : covalentTransactions.length > 0 ? covalentTransactions : [];

    // Classify wallet type
    const walletType = classifyWalletType(address, finalDebankInfo.totalValue, transactions);

    // Check if it's a known address and use proper label
    const knownLabels: Record<string, string> = {
      '0xDBF5E9c5206d0dB70a90108bf936DA60221dC080': 'Wintermute',
      '0x573ca9FF6b7f164dfF513077850d5CD796006fF4': 'Aster'
    };

    const label = knownLabels[address.toLowerCase()] || `0x${address.slice(2, 8)}...${address.slice(-6)}`;

    // Add to tracked wallets
    const newWallet = {
      address: address.toLowerCase(),
      label,
      type: walletType,
      addedAt: new Date().toISOString()
    };

    trackedWallets.push(newWallet);

    // Return wallet with full data
    const wallet = {
      address: newWallet.address,
      label: newWallet.label,
      balance: finalDebankInfo.balance,
      totalValue: finalDebankInfo.totalValue,
      lastActivity: finalDebankInfo.lastActivity,
      transactions,
      type: walletType,
      tokens: finalDebankInfo.tokens,
      defi_positions: finalDebankInfo.defi_positions
    };

    return NextResponse.json({
      success: true,
      wallet
    });
  } catch (error) {
    console.error('Failed to add wallet:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to add wallet' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { address } = await request.json();

    const index = trackedWallets.findIndex(w => w.address.toLowerCase() === address.toLowerCase());

    if (index === -1) {
      return NextResponse.json(
        { success: false, error: 'Wallet not found in tracking list' },
        { status: 404 }
      );
    }

    trackedWallets.splice(index, 1);

    return NextResponse.json({
      success: true,
      message: 'Wallet removed from tracking'
    });
  } catch (error) {
    console.error('Failed to remove wallet:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to remove wallet' },
      { status: 500 }
    );
  }
}