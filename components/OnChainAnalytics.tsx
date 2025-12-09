'use client';

import { useState, useEffect } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faBitcoinSign, faCoins, faGasPump, faCube, faChartLine, faNetworkWired } from '@fortawesome/free-solid-svg-icons';

interface BitcoinFees {
  fastestFee: number;
  halfHourFee: number;
  hourFee: number;
  economyFee: number;
  minimumFee: number;
}

interface EthereumGas {
  gasPrice: string;
  blockNumber: string;
}

interface TVLData {
  name: string;
  tvl: number;
}

interface BitcoinStats {
  blockHeight: number;
  totalBTC: string;
  hashRate: string;
}

export default function OnChainAnalytics() {
  const [bitcoinFees, setBitcoinFees] = useState<BitcoinFees | null>(null);
  const [ethereumGas, setEthereumGas] = useState<EthereumGas | null>(null);
  const [tvlData, setTvlData] = useState<TVLData[]>([]);
  const [bitcoinStats, setBitcoinStats] = useState<BitcoinStats | null>(null);
  const [loading, setLoading] = useState(true);

  // Fetch Bitcoin mempool fees
  useEffect(() => {
    const fetchBitcoinFees = async () => {
      try {
        const response = await fetch('/api/bitcoin-fees');
        const data = await response.json();
        setBitcoinFees(data);
      } catch (error) {
        console.error('Failed to fetch Bitcoin fees:', error);
      }
    };

    fetchBitcoinFees();
    const interval = setInterval(fetchBitcoinFees, 60000); // Update every minute
    return () => clearInterval(interval);
  }, []);

  // Fetch Ethereum gas price and block number
  useEffect(() => {
    const fetchEthereumData = async () => {
      try {
        const response = await fetch('/api/ethereum-data');
        const data = await response.json();
        setEthereumGas(data);
      } catch (error) {
        console.error('Failed to fetch Ethereum data:', error);
      }
    };

    fetchEthereumData();
    const interval = setInterval(fetchEthereumData, 30000); // Update every 30 seconds
    return () => clearInterval(interval);
  }, []);

  // Fetch TVL data from DeFi Llama
  useEffect(() => {
    const fetchTVLData = async () => {
      try {
        const response = await fetch('/api/tvl-data');
        const data = await response.json();
        setTvlData(data);
      } catch (error) {
        console.error('Failed to fetch TVL data:', error);
      }
    };

    fetchTVLData();
    const interval = setInterval(fetchTVLData, 300000); // Update every 5 minutes
    return () => clearInterval(interval);
  }, []);

  // Fetch Bitcoin stats from blockchain.com
  useEffect(() => {
    const fetchBitcoinStats = async () => {
      try {
        const response = await fetch('/api/bitcoin-stats');
        const data = await response.json();
        setBitcoinStats(data);
      } catch (error) {
        console.error('Failed to fetch Bitcoin stats:', error);
      }
    };

    fetchBitcoinStats();
    const interval = setInterval(fetchBitcoinStats, 60000); // Update every minute
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    // Set loading to false when all data is loaded
    if (bitcoinFees && ethereumGas && tvlData.length > 0 && bitcoinStats) {
      setLoading(false);
    }
  }, [bitcoinFees, ethereumGas, tvlData, bitcoinStats]);

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="terminal-panel text-center py-12">
          <h2 className="terminal-header text-2xl">🔗 On-Chain Analytics</h2>
          <p className="text-gray-400 mt-4">Loading blockchain data...</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="terminal-panel animate-pulse">
              <div className="h-32 bg-terminal-bg rounded"></div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="terminal-panel">
        <h2 className="terminal-header text-2xl">🔗 On-Chain Analytics</h2>
        <p className="text-gray-400 text-sm mt-2">
          Real-time blockchain metrics, network fees, and DeFi TVL data
        </p>
      </div>

      {/* Main Analytics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* Bitcoin Mempool Fees */}
        <div className="terminal-panel">
          <div className="flex items-center space-x-2 mb-4">
            <FontAwesomeIcon icon={faBitcoinSign} className="text-orange-500 w-5 h-5" />
            <h3 className="terminal-header text-lg">Bitcoin Fees</h3>
          </div>

          {bitcoinFees ? (
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-gray-400">Fastest:</span>
                <span className="text-green-400 font-mono">{bitcoinFees.fastestFee} sat/vB</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">30 min:</span>
                <span className="text-yellow-400 font-mono">{bitcoinFees.halfHourFee} sat/vB</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">1 hour:</span>
                <span className="text-blue-400 font-mono">{bitcoinFees.hourFee} sat/vB</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Economy:</span>
                <span className="text-gray-500 font-mono">{bitcoinFees.economyFee} sat/vB</span>
              </div>
            </div>
          ) : (
            <div className="text-center text-gray-500 py-4">Failed to load fees</div>
          )}
        </div>

        {/* Ethereum Gas & Blocks */}
        <div className="terminal-panel">
          <div className="flex items-center space-x-2 mb-4">
            <FontAwesomeIcon icon={faNetworkWired} className="text-blue-500 w-5 h-5" />
            <h3 className="terminal-header text-lg">Ethereum Network</h3>
          </div>

          {ethereumGas ? (
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-gray-400">Gas Price:</span>
                <span className="text-red-400 font-mono">{ethereumGas.gasPrice} Gwei</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Block:</span>
                <span className="text-green-400 font-mono">#{parseInt(ethereumGas.blockNumber).toLocaleString()}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Status:</span>
                <span className="text-green-400">🟢 Active</span>
              </div>
            </div>
          ) : (
            <div className="text-center text-gray-500 py-4">Failed to load data</div>
          )}
        </div>

        {/* Bitcoin Network Stats */}
        <div className="terminal-panel">
          <div className="flex items-center space-x-2 mb-4">
            <FontAwesomeIcon icon={faCube} className="text-orange-500 w-5 h-5" />
            <h3 className="terminal-header text-lg">Bitcoin Stats</h3>
          </div>

          {bitcoinStats ? (
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-gray-400">Block Height:</span>
                <span className="text-green-400 font-mono">#{bitcoinStats.blockHeight.toLocaleString()}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Total BTC:</span>
                <span className="text-yellow-400 font-mono">{bitcoinStats.totalBTC}M</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Hash Rate:</span>
                <span className="text-blue-400 font-mono">{bitcoinStats.hashRate} EH/s</span>
              </div>
            </div>
          ) : (
            <div className="text-center text-gray-500 py-4">Failed to load stats</div>
          )}
        </div>

        {/* DeFi TVL Rankings */}
        <div className="terminal-panel md:col-span-2 lg:col-span-3">
          <div className="flex items-center space-x-2 mb-4">
            <FontAwesomeIcon icon={faChartLine} className="text-purple-500 w-5 h-5" />
            <h3 className="terminal-header text-lg">Top Chains by TVL</h3>
          </div>

          {tvlData.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
              {tvlData.map((chain, index) => (
                <div key={chain.name} className="text-center">
                  <div className="text-2xl font-bold text-terminal-accent mb-1">
                    #{index + 1}
                  </div>
                  <div className="font-medium text-terminal-text mb-1">
                    {chain.name}
                  </div>
                  <div className="text-green-400 font-mono text-sm">
                    ${(chain.tvl / 1e9).toFixed(2)}B
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center text-gray-500 py-4">Failed to load TVL data</div>
          )}
        </div>

        {/* Network Health Indicators */}
        <div className="terminal-panel">
          <div className="flex items-center space-x-2 mb-4">
            <FontAwesomeIcon icon={faGasPump} className="text-red-500 w-5 h-5" />
            <h3 className="terminal-header text-lg">Network Health</h3>
          </div>

          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-gray-400">Bitcoin</span>
              <div className="flex items-center space-x-2">
                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                <span className="text-green-400 text-sm">Healthy</span>
              </div>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-gray-400">Ethereum</span>
              <div className="flex items-center space-x-2">
                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                <span className="text-green-400 text-sm">Healthy</span>
              </div>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-gray-400">DeFi Protocols</span>
              <div className="flex items-center space-x-2">
                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                <span className="text-green-400 text-sm">Active</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}