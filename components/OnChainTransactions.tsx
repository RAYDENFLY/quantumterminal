'use client';

import { useState, useEffect } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faWallet, faExchangeAlt, faArrowUp, faArrowDown, faClock, faCoins, faSearch, faTrash } from '@fortawesome/free-solid-svg-icons';

interface Transaction {
  hash: string;
  from: string;
  to: string;
  value: string;
  timestamp: string;
  blockNumber: number;
  gasUsed?: string;
  gasPrice?: string;
  tokenSymbol?: string;
  tokenAddress?: string;
  type: 'transfer' | 'swap' | 'deposit' | 'withdraw';
  chain: string;
}

interface WalletInfo {
  address: string;
  label: string;
  balance: string;
  totalValue: number;
  lastActivity: string;
  transactions: Transaction[];
  type: 'exchange' | 'whale' | 'defi' | 'contract' | 'unknown';
}

interface WhaleAlert {
  id: string;
  address: string;
  label: string;
  amount: number;
  symbol: string;
  type: 'deposit' | 'withdraw' | 'transfer';
  timestamp: string;
  exchange?: string;
}

export default function OnChainTransactions() {
  const [trackedWallets, setTrackedWallets] = useState<WalletInfo[]>([]);
  const [whaleAlerts, setWhaleAlerts] = useState<WhaleAlert[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'wallets' | 'alerts'>('wallets');
  const [walletFilter, setWalletFilter] = useState<string>('all');
  const [walletSearch, setWalletSearch] = useState<string>('');
  const [apiError, setApiError] = useState<string>('');

  // Pre-loaded whale wallets for monitoring (removed - users add manually now)
  // const WHALE_WALLETS = [];

  // Fetch wallet data
  useEffect(() => {
    const fetchWalletData = async () => {
      try {
        const response = await fetch('/api/wallet-tracking');
        const data = await response.json();

        if (data.success === false) {
          setApiError(data.error || 'Failed to load wallet data');
          setTrackedWallets([]);
        } else {
          setTrackedWallets(data.wallets || []);
          setApiError('');
        }
      } catch (error) {
        console.error('Failed to fetch wallet data:', error);
        setApiError('Unable to connect to blockchain APIs');
        setTrackedWallets([]);
      }
    };

    const fetchWhaleAlerts = async () => {
      try {
        const response = await fetch('/api/whale-alerts');
        const data = await response.json();
        setWhaleAlerts(data.alerts || []);
      } catch (error) {
        console.error('Failed to fetch whale alerts:', error);
      }
    };

    fetchWalletData();
    fetchWhaleAlerts();
    setLoading(false);

    // Update every 30 seconds
    const interval = setInterval(() => {
      fetchWalletData();
      fetchWhaleAlerts();
    }, 30000);

    return () => clearInterval(interval);
  }, []);

  const removeWallet = async (address: string) => {
    try {
      await fetch('/api/wallet-tracking', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ address })
      });

      setTrackedWallets(prev => prev.filter(wallet => wallet.address !== address));
    } catch (error) {
      console.error('Failed to remove wallet:', error);
    }
  };

  const formatValue = (value: number) => {
    if (value >= 1e9) return `$${(value / 1e9).toFixed(2)}B`;
    if (value >= 1e6) return `$${(value / 1e6).toFixed(2)}M`;
    if (value >= 1e3) return `$${(value / 1e3).toFixed(2)}K`;
    return `$${value.toFixed(2)}`;
  };

  const getTimeAgo = (timestamp: string) => {
    const now = new Date();
    const time = new Date(timestamp);
    const diff = now.getTime() - time.getTime();

    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (days > 0) return `${days}d ago`;
    if (hours > 0) return `${hours}h ago`;
    if (minutes > 0) return `${minutes}m ago`;
    return 'Just now';
  };

  const getWalletTypeColor = (type: string) => {
    switch (type) {
      case 'exchange': return 'text-blue-400';
      case 'whale': return 'text-purple-400';
      case 'defi': return 'text-green-400';
      case 'contract': return 'text-orange-400';
      default: return 'text-gray-400';
    }
  };

  // Filter and search wallets
  const filteredWallets = trackedWallets.filter(wallet => {
    const matchesFilter = walletFilter === 'all' || wallet.type === walletFilter;
    const matchesSearch = walletSearch === '' ||
      wallet.label.toLowerCase().includes(walletSearch.toLowerCase()) ||
      wallet.address.toLowerCase().includes(walletSearch.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="terminal-panel text-center py-12">
          <h2 className="terminal-header text-2xl">💰 On-Chain Transactions</h2>
          <p className="text-gray-400 mt-4">Loading wallet data...</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="terminal-panel animate-pulse">
              <div className="h-48 bg-terminal-bg rounded"></div>
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
        <h2 className="terminal-header text-2xl">💰 On-Chain Transactions</h2>
        <p className="text-gray-400 text-sm mt-2">
          Multi-wallet tracking with whale alerts and transaction monitoring
        </p>
      </div>

      {/* Maintenance Alert */}
      <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-lg p-4">
        <div className="flex items-center space-x-2">
          <FontAwesomeIcon icon={faClock} className="text-yellow-500 w-5 h-5" />
          <div>
            <div className="text-yellow-400 font-medium">Under Maintenance</div>
            <div className="text-yellow-300/80 text-sm">This feature is currently under development and maintenance</div>
          </div>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="flex space-x-1 mb-6">
        <button
          onClick={() => setActiveTab('wallets')}
          className={`px-4 py-2 rounded-lg transition-colors ${
            activeTab === 'wallets'
              ? 'bg-terminal-accent text-terminal-bg'
              : 'text-gray-400 hover:text-terminal-text hover:bg-terminal-bg'
          }`}
        >
          <FontAwesomeIcon icon={faWallet} className="w-4 h-4 mr-2" />
          Wallet Tracking
        </button>
        <button
          onClick={() => setActiveTab('alerts')}
          className={`px-4 py-2 rounded-lg transition-colors ${
            activeTab === 'alerts'
              ? 'bg-terminal-accent text-terminal-bg'
              : 'text-gray-400 hover:text-terminal-text hover:bg-terminal-bg'
          }`}
        >
          <FontAwesomeIcon icon={faExchangeAlt} className="w-4 h-4 mr-2" />
          Whale Alerts
        </button>
      </div>

      {activeTab === 'wallets' && (
        <>
          {/* Wallet Filters and Search */}
          <div className="terminal-panel">
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="flex-1">
                <input
                  type="text"
                  value={walletSearch}
                  onChange={(e) => setWalletSearch(e.target.value)}
                  placeholder="Search wallets..."
                  className="w-full px-3 py-2 bg-terminal-bg border border-terminal-border rounded text-terminal-text placeholder-gray-500 focus:border-terminal-accent focus:outline-none"
                />
              </div>
              <div className="flex space-x-2">
                <select
                  value={walletFilter}
                  onChange={(e) => setWalletFilter(e.target.value)}
                  className="px-3 py-2 bg-terminal-bg border border-terminal-border rounded text-terminal-text focus:border-terminal-accent focus:outline-none"
                >
                  <option value="all">All Types</option>
                  <option value="exchange">Exchange</option>
                  <option value="whale">Whale</option>
                  <option value="defi">DeFi</option>
                  <option value="contract">Contract</option>
                  <option value="unknown">Unknown</option>
                </select>
              </div>
            </div>
          </div>

          {/* Compact Wallet List */}
          <div className="terminal-panel">
            <h3 className="terminal-header text-lg mb-4">
              Tracked Wallets ({filteredWallets.length})
            </h3>

            {filteredWallets.length > 0 ? (
              <div className="space-y-2">
                {filteredWallets.map((wallet) => (
                  <div key={wallet.address} className="flex items-center justify-between p-3 bg-terminal-bg rounded hover:bg-opacity-80 transition-colors">
                    <div className="flex items-center space-x-3 flex-1 min-w-0">
                      <FontAwesomeIcon icon={faWallet} className="w-4 h-4 text-terminal-accent flex-shrink-0" />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center space-x-2 mb-1">
                          <span className="font-medium text-terminal-text truncate">{wallet.label}</span>
                          <span className={`text-xs px-2 py-0.5 rounded ${getWalletTypeColor(wallet.type)} bg-terminal-border`}>
                            {wallet.type}
                          </span>
                        </div>
                        <div className="text-xs text-gray-500 font-mono truncate">
                          {wallet.address}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center space-x-4 flex-shrink-0">
                      <div className="text-right">
                        <div className="text-sm font-bold text-green-400">
                          {formatValue(wallet.totalValue)}
                        </div>
                        <div className="text-xs text-gray-500">
                          {getTimeAgo(wallet.lastActivity)}
                        </div>
                      </div>

                      <div className="flex items-center space-x-2">
                        <span className="text-xs text-gray-400">
                          {wallet.transactions.length} tx
                        </span>
                        <button
                          onClick={() => removeWallet(wallet.address)}
                          className="text-red-400 hover:text-red-300 transition-colors"
                        >
                          <FontAwesomeIcon icon={faTrash} className="w-3 h-3" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center text-gray-500 py-8">
                {apiError ? (
                  <div className="space-y-2">
                    <div className="text-red-400 text-sm">{apiError}</div>
                    {apiError.includes('API key') && (
                      <div className="text-xs text-gray-600">
                        APIs may be temporarily unavailable. Check API keys in .env.local
                      </div>
                    )}
                    {apiError.includes('API key') && (
                      <div className="text-xs text-gray-500 mt-2">
                        Required: COVALENT_API_KEY, DEBANK_API_KEY
                      </div>
                    )}
                  </div>
                ) : walletSearch || walletFilter !== 'all' ? 'No wallets match your filters' : 'No wallets tracked yet'}
              </div>
            )}
          </div>
        </>
      )}

      {activeTab === 'alerts' && (
        <div className="space-y-4">
          <div className="terminal-panel">
            <h3 className="terminal-header text-lg mb-4">🐳 Whale Transaction Alerts</h3>
            <p className="text-gray-400 text-sm">
              Real-time monitoring of large transactions from major wallets and exchanges
            </p>
          </div>

          {whaleAlerts.length > 0 ? (
            <div className="space-y-2">
              {whaleAlerts.map((alert) => (
                <div key={alert.id} className="flex items-center justify-between p-3 bg-terminal-bg rounded hover:bg-opacity-80 transition-colors">
                  <div className="flex items-center space-x-3 flex-1 min-w-0">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
                      alert.type === 'deposit' ? 'bg-green-500/20 text-green-400' :
                      alert.type === 'withdraw' ? 'bg-red-500/20 text-red-400' :
                      'bg-blue-500/20 text-blue-400'
                    }`}>
                      {alert.type === 'deposit' ? (
                        <FontAwesomeIcon icon={faArrowDown} className="w-3 h-3" />
                      ) : alert.type === 'withdraw' ? (
                        <FontAwesomeIcon icon={faArrowUp} className="w-3 h-3" />
                      ) : (
                        <FontAwesomeIcon icon={faExchangeAlt} className="w-3 h-3" />
                      )}
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center space-x-2 mb-1">
                        <span className="font-medium text-terminal-text truncate">{alert.label}</span>
                        {alert.exchange && (
                          <span className="text-xs text-terminal-accent bg-terminal-border px-1.5 py-0.5 rounded">
                            {alert.exchange}
                          </span>
                        )}
                      </div>
                      <div className="text-sm text-gray-400">
                        {alert.type === 'deposit' ? '📥' :
                         alert.type === 'withdraw' ? '📤' : '↔️'} {alert.amount.toLocaleString()} {alert.symbol}
                      </div>
                    </div>
                  </div>

                  <div className="text-right flex-shrink-0">
                    <div className="text-sm font-bold text-terminal-accent">
                      ${formatValue(alert.amount * 2000)}
                    </div>
                    <div className="text-xs text-gray-500">
                      {getTimeAgo(alert.timestamp)}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="terminal-panel text-center py-8">
              <FontAwesomeIcon icon={faClock} className="w-12 h-12 text-gray-600 mb-4" />
              <div className="text-gray-400">No whale alerts at the moment</div>
              <div className="text-sm text-gray-500 mt-2">
                Large transactions will appear here in real-time
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}