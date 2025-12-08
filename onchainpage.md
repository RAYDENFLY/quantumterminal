ALTERNATIF ON-CHAIN DATA GRATIS 2024
🚀 1. MEMPOOL.SPACE (Bitcoin Data) - GRATIS
text
https://mempool.space/api
100% free, no API key needed

Real-time Bitcoin mempool & blockchain data

Rate limit: 30 requests/minute

Data: Fees, mempool, blocks, transactions

javascript
// Contoh data Bitcoin
const bitcoinData = {
  mempool: 'https://mempool.space/api/mempool',
  fees: 'https://mempool.space/api/v1/fees/recommended',
  blocks: 'https://mempool.space/api/blocks',
  address: 'https://mempool.space/api/address/{address}'
};

// Widget untuk Quantum Terminal
export function BitcoinMempoolWidget() {
  const [fees, setFees] = useState(null);
  
  useEffect(() => {
    fetch('https://mempool.space/api/v1/fees/recommended')
      .then(r => r.json())
      .then(data => setFees(data));
  }, []);
  
  return (
    <div className="terminal-card p-4">
      <h3 className="text-terminal-green font-mono">Bitcoin Mempool</h3>
      <div className="grid grid-cols-2 gap-2 mt-2">
        <div>Fastest Fee: <span className="text-green-400">{fees?.fastestFee} sat/vB</span></div>
        <div>Hour Fee: <span className="text-yellow-400">{fees?.hourFee} sat/vB</span></div>
      </div>
    </div>
  );
}
🚀 2. ETHERS.ORG (Ethereum Public API) - GRATIS
text
https://ethers.org
RPC endpoints untuk Ethereum

No API key required

Multiple providers untuk redundancy

javascript
// Multiple free Ethereum providers
const ETH_PROVIDERS = [
  'https://rpc.ankr.com/eth',
  'https://eth-mainnet.public.blastapi.io',
  'https://ethereum.publicnode.com',
  'https://1rpc.io/eth',
  'https://rpc.flashbots.net'
];

// Smart failover system
async function queryEthereum(method, params = []) {
  for (const provider of ETH_PROVIDERS) {
    try {
      const response = await fetch(provider, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          jsonrpc: '2.0',
          method,
          params,
          id: 1
        })
      });
      const data = await response.json();
      return data.result;
    } catch (error) {
      console.log(`Provider ${provider} failed, trying next...`);
    }
  }
  throw new Error('All Ethereum providers failed');
}

// Contoh penggunaan
const blockNumber = await queryEthereum('eth_blockNumber');
const gasPrice = await queryEthereum('eth_gasPrice');
🚀 3. BLOCKCHAIN.COM API - GRATIS
text
https://www.blockchain.com/explorer/api
Bitcoin data lengkap

No API key required

Rate limit: 1 request/10 seconds

javascript
const BLOCKCHAIN_API = {
  blockHeight: 'https://blockchain.info/q/getblockcount',
  totalBTC: 'https://blockchain.info/q/totalbc',
  hashRate: 'https://blockchain.info/q/hashrate',
  difficulty: 'https://blockchain.info/q/getdifficulty',
  latestBlock: 'https://blockchain.info/latestblock'
};

// Get multiple stats sekaligus
async function getBitcoinStats() {
  const [height, total, hashrate] = await Promise.all([
    fetch('https://blockchain.info/q/getblockcount').then(r => r.text()),
    fetch('https://blockchain.info/q/totalbc').then(r => r.text()),
    fetch('https://blockchain.info/q/hashrate').then(r => r.text())
  ]);
  
  return {
    blockHeight: parseInt(height),
    totalBTC: (parseInt(total) / 100000000).toFixed(2),
    hashRate: (parseInt(hashrate) / 1e18).toFixed(2) + ' EH/s'
  };
}
🚀 4. ETHERSCAN FREE TIER - GRATIS
text
https://etherscan.io/apis
Free plan: 5 calls/second, 100,000 calls/day

API key gratis (daftar di website)

Data: Transactions, balances, contract data

javascript
// Daftar dulu di etherscan.io untuk API key
const ETHERSCAN_API_KEY = 'YourApiKeyHere';

export async function getEthereumTransactions(address) {
  const url = `https://api.etherscan.io/api?module=account&action=txlist&address=${address}&startblock=0&endblock=99999999&sort=desc&apikey=${ETHERSCAN_API_KEY}`;
  
  const response = await fetch(url);
  const data = await response.json();
  
  return data.result.slice(0, 10); // 10 transaksi terakhir
}
🚀 5. COINGECKO API - GRATIS
text
https://www.coingecko.com/api/documentation
Free tier: 50 calls/minute, 10,000 calls/month

No API key untuk public endpoints

On-chain + market data

javascript
// CoinGecko public API (no key needed)
const COINGECKO_ENDPOINTS = {
  global: 'https://api.coingecko.com/api/v3/global',
  bitcoin: 'https://api.coingecko.com/api/v3/coins/bitcoin',
  ethereum: 'https://api.coingecko.com/api/v3/coins/ethereum',
  marketChart: 'https://api.coingecko.com/api/v3/coins/bitcoin/market_chart?vs_currency=usd&days=1'
};

// Untuk on-chain specific
async function getBitcoinOnChainData() {
  const response = await fetch('https://api.coingecko.com/api/v3/coins/bitcoin');
  const data = await response.json();
  
  return {
    activeAddresses: data.market_data?.active_addresses,
    transactionVolume: data.market_data?.total_volume?.btc,
    hashrate: data.developer_data?.hash_rate
  };
}
🚀 6. RUN NODE SENDIRI (100% Free, 100% Control)
Geth Light Client (Hanya 2GB storage)
bash
# Install Geth
# Untuk Mac:
brew tap ethereum/ethereum
brew install ethereum

# Untuk Ubuntu:
sudo add-apt-repository -y ppa:ethereum/ethereum
sudo apt-get update
sudo apt-get install ethereum

# Jalankan light node
geth --syncmode light --http --http.api eth,net,web3 --http.corsdomain "*" --http.addr 0.0.0.0
Bitcoin Core Pruned (Hanya 5GB storage)
bash
# Install Bitcoin Core
# Download dari: https://bitcoin.org/en/download

# Jalankan dengan pruning
bitcoind -prune=550 -server=1 -rpcuser=user -rpcpassword=pass -rpcallowip=127.0.0.1
API endpoint local setelah node jalan:

Ethereum: http://localhost:8545

Bitcoin: http://localhost:8332

javascript
// Query node lokal
async function queryLocalNode(method, params = []) {
  const response = await fetch('http://localhost:8545', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      jsonrpc: '2.0',
      method,
      params,
      id: 1
    })
  });
  return response.json();
}

// Contoh: Get latest block
const block = await queryLocalNode('eth_getBlockByNumber', ['latest', false]);
🚀 7. DEFI LLAMA API - GRATIS
text
https://defillama.com/docs/api
100% free, no API key

TVL data untuk semua chain

Protocol metrics

javascript
// DeFi Llama endpoints
const DEFILLAMA = {
  chains: 'https://api.llama.fi/chains',
  protocols: 'https://api.llama.fi/protocols',
  protocol: 'https://api.llama.fi/protocol/{protocol}',
  yields: 'https://yields.llama.fi/pools'
};

// Widget TVL untuk Quantum Terminal
export function TVLWidget() {
  const [tvlData, setTvlData] = useState([]);
  
  useEffect(() => {
    fetch('https://api.llama.fi/chains')
      .then(r => r.json())
      .then(data => {
        const topChains = data
          .sort((a, b) => b.tvl - a.tvl)
          .slice(0, 5);
        setTvlData(topChains);
      });
  }, []);
  
  return (
    <div className="terminal-card p-4">
      <h3 className="text-terminal-green font-mono">Top Chains by TVL</h3>
      {tvlData.map(chain => (
        <div key={chain.name} className="flex justify-between py-1">
          <span>{chain.name}</span>
          <span className="text-green-400">${(chain.tvl/1e9).toFixed(2)}B</span>
        </div>
      ))}
    </div>
  );
}
🚀 8. DUNE ANALYTICS COMMUNITY QUERIES - GRATIS
text
https://dune.com/browse/queries
Gratis untuk query yang sudah ada

Copy query ID dari explorer

Use existing queries

Cara pakai:

Cari query di https://dune.com/browse/queries

Klik query yang menarik

Salin Query ID dari URL

Gunakan di code:

javascript
// Query ID: 3150671 (Contoh: Ethereum Daily Transactions)
async function getDuneData(queryId) {
  // Note: Untuk akses full butuh API key, 
  // tapi bisa scrape dari public page
  const url = `https://dune.com/api/query/${queryId}/results`;
  
  // Atau gunakan public CSV export
  const csvUrl = `https://dune.com/api/query/${queryId}/csv`;
  
  // Fallback: Scrape dari HTML (last resort)
  const html = await fetch(`https://dune.com/queries/${queryId}`).then(r => r.text());
  // Parse data dari HTML...
}
🚀 10. CUSTOM SOLUTION: Web3.js + Ethers.js
Direct Blockchain Queries
javascript
import { ethers } from 'ethers';

// Setup provider dengan multiple fallbacks
const provider = new ethers.JsonRpcProvider(
  'https://rpc.ankr.com/eth'
);

// Get on-chain data langsung
async function getOnChainMetrics() {
  const blockNumber = await provider.getBlockNumber();
  const block = await provider.getBlock(blockNumber);
  
  // Hitung beberapa metrics
  const blocksPerDay = 24 * 60 * 60 / 12; // Ethereum: 12 detik per block
  
  return {
    currentBlock: blockNumber,
    dailyTransactions: block.transactions.length * blocksPerDay,
    gasPrice: ethers.formatUnits(await provider.getGasPrice(), 'gwei'),
    chainId: (await provider.getNetwork()).chainId
  };
}