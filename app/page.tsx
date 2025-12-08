'use client';

import { useEffect, useState } from 'react';
import TopBar from '@/components/TopBar';
import MarketOverview from '@/components/MarketOverview';
import NewsFeed from '@/components/NewsFeed';
import FearGreedIndex from '@/components/FearGreedIndex';
import TopGainersLosers from '@/components/TopGainersLosers';
import OnChainAnalytics from '@/components/OnChainAnalytics';
import { useHotkeys } from '@/hooks/useHotkeys';

export default function Home() {
  const [activeModule, setActiveModule] = useState<string>('market');

  // Hotkeys navigation
  useHotkeys([
    { key: 'Alt+1', action: () => setActiveModule('market') },
    { key: 'Alt+2', action: () => setActiveModule('news') },
    { key: 'Alt+3', action: () => setActiveModule('onchain') },
    { key: 'Alt+4', action: () => setActiveModule('research') },
  ]);

  const renderActiveModule = () => {
    switch (activeModule) {
      case 'market':
        return (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            {/* Left Column - Market Overview */}
            <div className="lg:col-span-2 space-y-4">
              <MarketOverview />
              <TopGainersLosers />
            </div>

            {/* Right Column - Indicators & Info */}
            <div className="space-y-4">
              <FearGreedIndex />
              <NewsFeed />
            </div>
          </div>
        );

      case 'news':
        return (
          <div className="max-w-7xl mx-auto">
            <div className="terminal-panel mb-6">
              <h2 className="terminal-header text-2xl">📰 Latest Crypto News</h2>
              <p className="text-gray-400 text-sm mt-2">Real-time news feed with sentiment analysis from top crypto sources</p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
              {/* Main News Feed - Full Width */}
              <div className="lg:col-span-3">
                <NewsFeed />
              </div>

              {/* Sidebar */}
              <div className="space-y-4">
                <FearGreedIndex />
              </div>
            </div>
          </div>
        );

      case 'onchain':
        return (
          <div className="max-w-7xl mx-auto">
            <OnChainAnalytics />
          </div>
        );

      case 'research':
        return (
          <div className="max-w-6xl mx-auto">
            <div className="terminal-panel text-center py-12">
              <h2 className="terminal-header text-2xl">📚 Research Papers</h2>
              <p className="text-gray-400 mt-4">Coming Soon...</p>
              <p className="text-sm text-gray-500 mt-2">
                Academic papers, DeFi research, and blockchain analysis
              </p>
            </div>
          </div>
        );

      default:
        return (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            {/* Left Column - Market Overview */}
            <div className="lg:col-span-2 space-y-4">
              <MarketOverview />
              <TopGainersLosers />
            </div>

            {/* Right Column - Indicators & Info */}
            <div className="space-y-4">
              <FearGreedIndex />
              <NewsFeed />
            </div>
          </div>
        );
    }
  };

  return (
    <div className="min-h-screen flex flex-col">
      <TopBar activeModule={activeModule} setActiveModule={setActiveModule} />

      <main className="flex-1 p-4 space-y-4">
        {renderActiveModule()}
      </main>

      {/* Footer */}
      <footer className="border-t border-terminal-border p-4 text-center text-xs text-gray-500">
        <p>⚠️ DISCLAIMER: For informational and educational purposes only. Not financial advice.</p>
        <p className="mt-1">Data provided by CoinGecko, CryptoPanic, Alternative.me, Mempool.space, Blockchain.com, and DeFi Llama</p>
      </footer>
    </div>
  );
}
