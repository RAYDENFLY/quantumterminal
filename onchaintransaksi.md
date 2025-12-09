🚀 1. NANSEN - via DUNE ANALYTICS (GRATIS, Available NOW)
Kelebihan: Labeling sama bagusnya dengan Arkham, bahkan lebih established

sql
-- Query GRATIS di Dune untuk data Nansen
-- No API key needed untuk query yang sudah ada!

-- Contoh: Cari whale activities
SELECT 
  labels.label as entity_name,
  labels.label_type,
  COUNT(*) as tx_count,
  SUM(t.value)/1e18 as total_eth_volume
FROM ethereum.transactions t
JOIN nansen.labels labels 
  ON t."from" = labels.address 
  OR t.to = labels.address
WHERE labels.label_type IN ('cex', 'whale', 'institution')
  AND t.block_time > NOW() - INTERVAL '7 days'
GROUP BY labels.label, labels.label_type
ORDER BY total_eth_volume DESC
LIMIT 20;
Cara Pakai:

Buka https://dune.com/nansen

Cari query dengan tag "nansen" atau "whale"

Copy query ID

Export data ke CSV atau query langsung via API

javascript
// Ambil data dari query Dune yang sudah ada
async function getNansenWhaleData(queryId = '3150671') {
  // Public endpoint (no auth needed for public queries)
  const response = await fetch(
    `https://api.dune.com/api/v1/query/${queryId}/results`
  );
  const data = await response.json();
  return data;
}
🚀 2. ETHERSCAN LABEL CLOUD (GRATIS, Available NOW)
Kelebihan: Labels langsung dari Etherscan, real-time

javascript
// Etherscan sudah punya labeling system
async function getEtherscanLabels(address) {
  const apiKey = process.env.ETHERSCAN_API_KEY;
  
  // Get contract info (sering ada label)
  const response = await fetch(
    `https://api.etherscan.io/api?module=contract&action=getsourcecode&address=${address}&apikey=${apiKey}`
  );
  
  const data = await response.json();
  
  if (data.result[0].ContractName) {
    return {
      label: data.result[0].ContractName,
      source: 'Etherscan Contract'
    };
  }
  
  // Check jika address adalah exchange known
  const EXCHANGE_ADDRESSES = {
    '0x28c6c06298d514db089934071355e5743bf21d60': 'Binance 14',
    '0x5e5c8c0d2c1d5e153e6c3e0e0a7c7f2c6f6d6b5': 'Coinbase',
    '0xdfd5293d8e347dfe59e90efd55b2956a1343963d': 'Binance 15',
    '0xfbb1b73c4f0bda4f67dca266ce6ef42f520fbb98': 'Bittrex',
    '0xe8006c9ca0ac1c6ad7a4f275b295e5e7c8c3aa7b': 'Huobi',
    '0x2910543af39aba0cd09dbb2d50200b3e800a63d2': 'Kraken',
    '0x4a9...': 'FTX (RIP)'
  };
  
  if (EXCHANGE_ADDRESSES[address.toLowerCase()]) {
    return {
      label: EXCHANGE_ADDRESSES[address.toLowerCase()],
      source: 'Known Exchange'
    };
  }
  
  return null;
}

// Build custom label database
const CUSTOM_WHALE_DB = {
  '0x00000000219ab540356cbb839cbe05303d7705fa': 'Eth2 Deposit Contract',
  '0xbe0eb53f46cd790cd13851d5eff43d12404d33e8': 'Binance US Cold Wallet',
  '0x742d35cc6634c0532925a3b844bc454e4438f44e': 'Bitfinex Cold Wallet',
  '0x34ea4138580435b5a521e460035edb19df1938c1': 'FTX Cold Wallet',
  '0x1b3cb81e51011b549d78bf720b0d924ac763a7c2': 'Google Cloud',
  '0x2faf487a4414fe77e2327f0bf4ae2a264a776ad2': 'FTX US',
  '0x28c6c06298d514db089934071355e5743bf21d60': 'Binance 14',
  '0xdfd5293d8e347dfe59e90efd55b2956a1343963d': 'Binance 15',
  '0xf977814e90da44bfa03b6295a0616a897441acec': 'Binance 8 (Whale)',
  '0x5a52e96bacdabb82fd05763e25335261b270efcb': 'Binance 9',
  '0xeb2d2f1b8c558a40207669291fda468e50c8a0bb': 'Crypto.com',
  '0x6262998ced04146fa42253a5c0af90ca02dfd2a3': 'Crypto.com 2',
  '0x46340b20830761efd32832a74d7169b29feb9758': 'Crypto.com 3',
  '0xcffad3200574698b78f32232aa9d63eabd290703': 'Crypto.com 4'
};
🚀 3. ZERION API (FREE Tier, Available NOW)
Kelebihan: Wallet profiling, DeFi positions tracking

javascript
// Zerion API - 50 requests/minute FREE
const ZERION_API_KEY = 'your-key'; // Daftar gratis

async function getZerionWalletData(address) {
  const response = await fetch(
    `https://api.zerion.io/v1/wallets/${address}/portfolio`,
    {
      headers: {
        'Authorization': `Bearer ${ZERION_API_KEY}`,
        'Accept': 'application/json'
      }
    }
  );
  
  const data = await response.json();
  
  // Extract useful info
  return {
    totalValue: data.data?.attributes?.total_value,
    positions: data.data?.attributes?.positions || [],
    protocols: data.data?.attributes?.protocols || []
  };
}
🚀 4. DEBANK OPENAPI (FREE, Available NOW)
Kelebihan: Komprehensif, multi-chain, real portfolio

javascript
// DeBank OpenAPI - 120 requests/minute FREE
async function getDeBankWalletInfo(address) {
  // 1. Get portfolio value
  const portfolio = await fetch(
    `https://openapi.debank.com/v1/user/total_balance?id=${address}`
  ).then(r => r.json());
  
  // 2. Get token holdings
  const tokens = await fetch(
    `https://openapi.debank.com/v1/user/token_list?id=${address}`
  ).then(r => r.json());
  
  // 3. Get DeFi positions
  const defi = await fetch(
    `https://openapi.debank.com/v1/user/complex_protocol_list?id=${address}`
  ).then(r => r.json());
  
  return {
    total_usd: portfolio.total_usd_value,
    tokens: tokens.filter(t => t.amount > 0),
    defi_positions: defi,
    address: address
  };
}

// Track multiple whales
const WHALE_LIST = [
  '0xfbb1b73c4f0bda4f67dca266ce6ef42f520fbb98', // Bittrex
  '0x28c6c06298d514db089934071355e5743bf21d60', // Binance
  '0x5a52e96bacdabb82fd05763e25335261b270efcb'  // Binance 9
];

async function trackWhales() {
  const whaleData = await Promise.all(
    WHALE_LIST.map(addr => getDeBankWalletInfo(addr))
  );
  
  // Analyze changes
  return whaleData.map(w => ({
    address: w.address,
    label: CUSTOM_WHALE_DB[w.address] || 'Unknown Whale',
    totalValue: `$${(w.total_usd / 1e6).toFixed(2)}M`,
    topTokens: w.tokens.slice(0, 3).map(t => ({
      symbol: t.symbol,
      amount: t.amount,
      value: t.price * t.amount
    }))
  }));
}
🚀 5. COVALENT (FREE Tier, Available NOW)
Kelebihan: Historical data lengkap, multi-chain

javascript
// Covalent - 5 requests/sec, 100k/month FREE
const COVALENT_API_KEY = 'cqt_rxxxxxxxxxxxx'; // Daftar gratis

async function getWhaleTransactions(address, chainId = 1) {
  const response = await fetch(
    `https://api.covalenthq.com/v1/${chainId}/address/${address}/transactions_v2/?key=${COVALENT_API_KEY}&page-size=100`
  );
  
  const data = await response.json();
  
  // Analyze for whale patterns
  const largeTxs = data.data.items.filter(tx => 
    tx.value > 100 * 1e18 // > 100 ETH
  );
  
  return {
    totalTxs: data.data.items.length,
    largeTransactions: largeTxs,
    firstSeen: data.data.items[data.data.items.length - 1]?.block_signed_at,
    lastActive: data.data.items[0]?.block_signed_at
  };
}
🚀 6. LOOKONCHAIN (Scraping, FREE)
Kelebihan: Sumber informasi whale yang populer

javascript
// Method 1: Monitor Twitter mereka @lookonchain
// Mereka sering tweet whale activities

// Method 2: Scrape website mereka (ethical scraping)
async function getLookonchainInsights() {
  // Example: Mereka punya endpoint publik
  try {
    const response = await fetch(
      'https://lookonchain.com/api/whale-activities',
      {
        headers: {
          'User-Agent': 'Quantum Terminal Bot/1.0'
        }
      }
    );
    
    if (response.ok) {
      return response.json();
    }
  } catch (error) {
    // Fallback: Parse dari Twitter
    return await parseLookonchainTwitter();
  }
}

// Method 3: Twitter API (FREE tier)
async function parseLookonchainTwitter() {
  // Mereka tweet format seperti:
  // "🐳 A whale deposited 10,000 $ETH ($31M) to #Binance"
  // "🚀 Smart money buying 5,000 $ETH..."
  
  // Bisa use Twitter API v2 FREE (450 requests/15 min)
  const tweets = await fetch(
    `https://api.twitter.com/2/tweets/search/recent?query=from:lookonchain&max_results=20`,
    {
      headers: {
        'Authorization': `Bearer ${process.env.TWITTER_BEARER_TOKEN}`
      }
    }
  ).then(r => r.json());
  
  // Parse tweets untuk extract data
  return tweets.data.map(parseWhaleTweet);
}

function parseWhaleTweet(tweetText) {
  const patterns = [
    // Pattern 1: Whale deposit/withdrawal
    /🐳.*?(\d{1,3}(?:,\d{3})*)\s*\$?ETH.*?\$(\d{1,3}(?:,\d{3})*)M?/i,
    // Pattern 2: Smart money
    /🚀.*?(\d{1,3}(?:,\d{3})*)\s*\$?ETH/i,
    // Pattern 3: Address mentioned
    /0x[a-fA-F0-9]{40}/
  ];
  
  // Extract info
  return {
    text: tweetText,
    ethAmount: tweetText.match(/\d{1,3}(?:,\d{3})*/)?.[0],
    usdValue: tweetText.match(/\$(\d+(?:\.\d+)?)M?/)?.[1],
    addresses: tweetText.match(/0x[a-fA-F0-9]{40}/g) || []
  };
}
🚀 7. BUILD CUSTOM WHALE DATABASE
Strategi: Aggregate dari multiple sources

javascript
// lib/whale/WhaleDatabase.ts
export class WhaleDatabase {
  private whales = new Map();
  
  constructor() {
    this.initDatabase();
  }
  
  async initDatabase() {
    // Source 1: Known exchange addresses
    await this.loadExchangeAddresses();
    
    // Source 2: Etherscan verified contracts
    await this.loadEtherscanLabels();
    
    // Source 3: Community-contributed labels
    await this.loadCommunityLabels();
    
    // Source 4: Track baru dari large transactions
    this.startTrackingNewWhales();
  }
  
  async loadExchangeAddresses() {
    // Dari berbagai sources
    const exchanges = [
      // Binance
      { address: '0x28c6c06298d514db089934071355e5743bf21d60', label: 'Binance 14', type: 'exchange' },
      { address: '0xdfd5293d8e347dfe59e90efd55b2956a1343963d', label: 'Binance 15', type: 'exchange' },
      { address: '0xf977814e90da44bfa03b6295a0616a897441acec', label: 'Binance 8 (Whale)', type: 'exchange/whale' },
      
      // Coinbase
      { address: '0x5e5c8c0d2c1d5e153e6c3e0e0a7c7f2c6f6d6b5', label: 'Coinbase', type: 'exchange' },
      
      // FTX (historical)
      { address: '0x2faf487a4414fe77e2327f0bf4ae2a264a776ad2', label: 'FTX US', type: 'exchange' },
      
      // Crypto.com
      { address: '0xeb2d2f1b8c558a40207669291fda468e50c8a0bb', label: 'Crypto.com', type: 'exchange' },
      
      // Kraken
      { address: '0x2910543af39aba0cd09dbb2d50200b3e800a63d2', label: 'Kraken', type: 'exchange' },
      
      // Gemini
      { address: '0xd24400ae8bfebb18ca49be86258a3c749cf46853', label: 'Gemini', type: 'exchange' }
    ];
    
    exchanges.forEach(ex => {
      this.whales.set(ex.address.toLowerCase(), {
        ...ex,
        source: 'exchange_known',
        lastUpdated: Date.now()
      });
    });
  }
  
  async detectNewWhales() {
    // Monitor large transactions untuk detect whales baru
    const largeTxs = await this.getRecentLargeTransactions(100 * 1e18); // > 100 ETH
    
    largeTxs.forEach(tx => {
      const from = tx.from.toLowerCase();
      const to = tx.to.toLowerCase();
      
      // Jika address belum diketahui dan melakukan transaksi besar
      if (!this.whales.has(from) && parseInt(tx.value) > 1000 * 1e18) {
        this.whales.set(from, {
          address: from,
          label: `Whale-${from.slice(0, 8)}`,
          type: 'potential_whale',
          firstSeen: Date.now(),
          largestTx: tx.value,
          source: 'auto_detected'
        });
      }
      
      // Sama untuk penerima
      if (!this.whales.has(to) && parseInt(tx.value) > 1000 * 1e18) {
        this.whales.set(to, {
          address: to,
          label: `Whale-${to.slice(0, 8)}`,
          type: 'potential_whale',
          firstSeen: Date.now(),
          largestTx: tx.value,
          source: 'auto_detected'
        });
      }
    });
  }
  
  getWhaleInfo(address) {
    const info = this.whales.get(address.toLowerCase());
    
    if (info) return info;
    
    // Jika tidak diketahui, coba classify
    return this.classifyUnknownAddress(address);
  }
  
  classifyUnknownAddress(address) {
    // Rules-based classification
    const checks = [
      this.checkIfExchange(address),
      this.checkIfDeFiProtocol(address),
      this.checkIfContract(address),
      this.checkIfEOAWithBalance(address)
    ];
    
    const result = checks.find(check => check !== null);
    
    return result || {
      address,
      label: `0x${address.slice(2, 8)}...${address.slice(-6)}`,
      type: 'unknown',
      confidence: 0
    };
  }
}