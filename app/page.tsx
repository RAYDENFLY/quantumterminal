'use client';

import { useEffect, useState } from 'react';
import TopBar from '@/components/TopBar';
import MarketOverview from '@/components/MarketOverview';
import NewsFeed from '@/components/NewsFeed';
import FearGreedIndex from '@/components/FearGreedIndex';
import TopGainersLosers from '@/components/TopGainersLosers';
import OnChainAnalytics from '@/components/OnChainAnalytics';
import OnChainTransactions from '@/components/OnChainTransactions';
import ResearchPage from '@/components/ResearchPage';
import LearningPage from '@/components/LearningPage';
import { useHotkeys } from '@/hooks/useHotkeys';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faArrowUp, faArrowDown, faMinus, faSignal, faExternalLinkAlt } from '@fortawesome/free-solid-svg-icons';
import useSWR from 'swr';

const fetcher = (url: string) => fetch(url).then((res) => res.json());

export default function Home() {
  const [activeModule, setActiveModule] = useState<string>('market');

  // Fetch market data for trading signals
  const { data: marketData } = useSWR('/api/global-market', fetcher, { refreshInterval: 60000 });

  // Generate trading signals based on market conditions
  const getTradingSignals = () => {
    if (!marketData?.data) return [];

    const signals: Array<any> = [];
    const marketChange = marketData.data.market_cap_change_percentage_24h_usd;
    const btcDom = marketData.data.market_cap_percentage.btc;

    // BTC Signal
    if (marketChange > 5) {
      signals.push({
        asset: 'BTC',
        signal: 'LONG',
        strength: 'Author: Azis Maulana',
        reason: 'Conviction: 8/10',
        status: 'Running',
        icon: faArrowUp,
        color: 'text-terminal-success',
        entry: '$95,000 - $98,000',
        sl: '$92,000',
        tp1: '$110,000',
        tp2: '$125,000',
        tp3: '$140,000'
      });
    } else if (marketChange < -5) {
      signals.push({
        asset: 'BTC',
        signal: 'SHORT',
        strength: 'Author: Azis Maulana',
        reason: 'Conviction: 7/10',
        status: 'SL',
        icon: faArrowDown,
        color: 'text-terminal-danger',
        entry: '$85,000 - $87,000',
        sl: '$89,000',
        tp1: '$75,000',
        tp2: '$70,000',
        tp3: '$65,000'
      });
    }

    // ETH Signal
    signals.push({
      asset: 'ETH',
      signal: 'LONG',
      strength: 'Author: Azis Maulana',
      reason: 'Conviction: 9/10',
      status: 'Running',
      icon: faArrowUp,
      color: 'text-terminal-success',
      entry: '$3,800 - $3,900',
      sl: '$3,600',
      tp1: '$4,200',
      tp2: '$4,500',
      tp3: '$4,800'
    });

    // BNB Signal
    signals.push({
      asset: 'BNB',
      signal: 'LONG',
      strength: 'Author: Azis Maulana',
      reason: 'Conviction: 7/10',
      status: 'TP 1',
      icon: faArrowUp,
      color: 'text-terminal-success',
      entry: '$580 - $600',
      sl: '$550',
      tp1: '$650',
      tp2: '$720',
      tp3: '$800'
    });

    // SOL Signal
    signals.push({
      asset: 'SOL',
      signal: 'SHORT',
      strength: 'Author: Azis Maulana',
      reason: 'Conviction: 6/10',
      status: 'Wait / In Limit Order',
      icon: faArrowDown,
      color: 'text-terminal-danger',
      entry: '$180 - $185',
      sl: '$195',
      tp1: '$150',
      tp2: '$130',
      tp3: '$110'
    });

    // DOT Signal
    signals.push({
      asset: 'DOT',
      signal: 'LONG',
      strength: 'Author: Azis Maulana',
      reason: 'Conviction: 8/10',
      status: 'Running',
      icon: faArrowUp,
      color: 'text-terminal-success',
      entry: '$28 - $30',
      sl: '$26',
      tp1: '$35',
      tp2: '$42',
      tp3: '$50'
    });

    // LINK Signal
    signals.push({
      asset: 'LINK',
      signal: 'LONG',
      strength: 'Author: Azis Maulana',
      reason: 'Conviction: 7/10',
      status: 'TP 2',
      icon: faArrowUp,
      color: 'text-terminal-success',
      entry: '$18 - $19',
      sl: '$17',
      tp1: '$22',
      tp2: '$25',
      tp3: '$28'
    });

    return signals;
  };

  const tradingSignals = getTradingSignals();

  // Hotkeys navigation
  useHotkeys([
    { key: 'Alt+1', action: () => setActiveModule('market') },
    { key: 'Alt+2', action: () => setActiveModule('news') },
    { key: 'Alt+3', action: () => setActiveModule('onchain') },
    { key: 'Alt+4', action: () => setActiveModule('research') },
    { key: 'Alt+5', action: () => setActiveModule('learning') },
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
              
              {/* Trading Signals */}
              {tradingSignals.length > 0 && (
                <div className="bg-terminal-bg rounded-lg p-4 border border-terminal-border">
                  <h3 className="text-sm font-semibold text-terminal-accent mb-4 flex items-center">
                    <FontAwesomeIcon icon={faSignal} className="w-4 h-4 mr-2" />
                    Trading Signals
                  </h3>
                  <p className="text-xs text-gray-400 mb-4 leading-relaxed">
                    Selalu ingat bahwa trading futures memiliki risiko yang sangat tinggi. Seluruh chart, analisis, atau pandangan yang saya bagikan bukan merupakan ajakan atau saran investasi. Semua hanyalah hasil dari analisis pribadi yang bisa saja salah.<br/><br/>
                    Profit maupun kerugian menjadi tanggung jawab masing-masing trader.<br/>
                    Pastikan selalu menggunakan Risk Management yang baik dan tidak pernah menggunakan dana yang kamu tidak siap kehilangannya.
                  </p>
                  <div className="flex gap-4 overflow-x-auto pb-2">
                    {tradingSignals.map((signal, index) => (
                      <div key={index} className="bg-terminal-panel rounded-lg p-3 border border-terminal-border flex-shrink-0 w-64">
                        <div className="text-sm font-medium text-terminal-accent mb-1">{signal.asset}</div>
                        <div className="flex items-center justify-between mb-2">
                          <div className={`flex items-center space-x-1 text-xs ${signal.color}`}>
                            <FontAwesomeIcon icon={signal.icon} className="w-3 h-3" />
                            <span className="font-semibold">{signal.signal}</span>
                          </div>
                          <div className={`text-xs px-2 py-1 rounded ${
                            signal.status === 'Running' ? 'bg-green-500/20 text-green-400' :
                            signal.status === 'Wait' ? 'bg-yellow-500/20 text-yellow-400' :
                            signal.status === 'SL' ? 'bg-red-500/20 text-red-400' :
                            'bg-blue-500/20 text-blue-400'
                          }`}>
                            {signal.status}
                          </div>
                        </div>
                        <div className="text-xs text-gray-400 mb-1">{signal.strength} Signal</div>
                        <div className="text-xs text-gray-500 mb-3">{signal.reason}</div>
                        
                        {/* Trading Details */}
                        <div className="border-t border-terminal-border pt-2 space-y-1">
                          <div className="flex justify-between text-xs">
                            <span className="text-gray-400">Entry:</span>
                            <span className="text-terminal-accent font-medium">{signal.entry}</span>
                          </div>
                          <div className="flex justify-between text-xs">
                            <span className="text-gray-400">SL:</span>
                            <span className="text-terminal-danger font-medium">{signal.sl}</span>
                          </div>
                          <div className="flex justify-between text-xs">
                            <span className="text-gray-400">TP 1:</span>
                            <span className="text-terminal-success font-medium">{signal.tp1}</span>
                          </div>
                          <div className="flex justify-between text-xs">
                            <span className="text-gray-400">TP 2:</span>
                            <span className="text-terminal-success font-medium">{signal.tp2}</span>
                          </div>
                          <div className="flex justify-between text-xs">
                            <span className="text-gray-400">TP 3:</span>
                            <span className="text-terminal-success font-medium">{signal.tp3}</span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              
              {/* Market Update */}
              <div className="bg-terminal-bg rounded-lg p-4 border border-terminal-border">
                <h3 className="text-sm font-semibold text-terminal-accent mb-4 flex items-center">
                  <FontAwesomeIcon icon={faSignal} className="w-4 h-4 mr-2" />
                  Market Update
                </h3>
                <div className="flex gap-4 overflow-x-auto pb-2">
                  {/* Post 1 */}
                  <div className="bg-terminal-panel rounded-lg border border-terminal-border flex-shrink-0 w-80 overflow-hidden">
                    {/* Header */}
                    <div className="p-3 border-b border-terminal-border">
                      <div className="flex items-center space-x-3">
                        <div className="w-6 h-6 bg-terminal-accent rounded-full flex items-center justify-center">
                          <span className="text-xs font-bold text-black">M</span>
                        </div>
                        <div>
                          <div className="text-xs font-semibold text-terminal-accent">Mokizuki</div>
                          <div className="text-xs text-gray-400">2h</div>
                        </div>
                      </div>
                    </div>
                    
                    {/* Image Placeholder */}
                    <div className="aspect-[16/9] bg-terminal-bg flex items-center justify-center">
                      <div className="text-center">
                        <FontAwesomeIcon icon={faSignal} className="w-8 h-8 text-terminal-accent mb-1" />
                        <div className="text-xs text-gray-400">BTC/USD Chart</div>
                      </div>
                    </div>
                    
                    {/* Content */}
                    <div className="p-3">
                      <div className="space-y-2 mb-3">
                        <div className="text-xs">
                          <span className="font-semibold text-terminal-accent">🚀 Bullish Signals</span><br/>
                          • BTC breaking above $95,000 resistance<br/>
                          • ETH staking rewards at all-time high
                        </div>
                      </div>
                      
                      {/* Engagement */}
                      <div className="flex items-center justify-between text-xs text-gray-400 border-t border-terminal-border pt-2">
                        <div className="flex space-x-3">
                          <span>1,234 likes</span>
                          <span>89 comments</span>
                        </div>
                        <div className="text-xs text-gray-500">Dec 9</div>
                      </div>
                    </div>
                  </div>
                  
                  {/* Post 2 */}
                  <div className="bg-terminal-panel rounded-lg border border-terminal-border flex-shrink-0 w-80 overflow-hidden">
                    {/* Header */}
                    <div className="p-3 border-b border-terminal-border">
                      <div className="flex items-center space-x-3">
                        <div className="w-6 h-6 bg-terminal-accent rounded-full flex items-center justify-center">
                          <span className="text-xs font-bold text-black">JT</span>
                        </div>
                        <div>
                          <div className="text-xs font-semibold text-terminal-accent">Jurnal Trading</div>
                          <div className="text-xs text-gray-400">4h</div>
                        </div>
                      </div>
                    </div>
                    
                    {/* Image Placeholder */}
                    <div className="aspect-[16/9] bg-terminal-bg flex items-center justify-center">
                      <div className="text-center">
                        <FontAwesomeIcon icon={faSignal} className="w-8 h-8 text-terminal-accent mb-1" />
                        <div className="text-xs text-gray-400">ETH/USD Chart</div>
                      </div>
                    </div>
                    
                    {/* Content */}
                    <div className="p-3">
                      <div className="space-y-2 mb-3">
                        <div className="text-xs">
                          <span className="font-semibold text-terminal-accent">⚠️ Risk Factors</span><br/>
                          • Regulatory uncertainty in major markets<br/>
                          • Macroeconomic pressures increasing
                        </div>
                      </div>
                      
                      {/* Engagement */}
                      <div className="flex items-center justify-between text-xs text-gray-400 border-t border-terminal-border pt-2">
                        <div className="flex space-x-3">
                          <span>856 likes</span>
                          <span>67 comments</span>
                        </div>
                        <div className="text-xs text-gray-500">Dec 9</div>
                      </div>
                    </div>
                  </div>
                  
                  {/* Post 3 */}
                  <div className="bg-terminal-panel rounded-lg border border-terminal-border flex-shrink-0 w-80 overflow-hidden">
                    {/* Header */}
                    <div className="p-3 border-b border-terminal-border">
                      <div className="flex items-center space-x-3">
                        <div className="w-6 h-6 bg-terminal-accent rounded-full flex items-center justify-center">
                          <span className="text-xs font-bold text-black">R</span>
                        </div>
                        <div>
                          <div className="text-xs font-semibold text-terminal-accent">RAYDENFLY</div>
                          <div className="text-xs text-gray-400">6h</div>
                        </div>
                      </div>
                    </div>
                    
                    {/* Image Placeholder */}
                    <div className="aspect-[16/9] bg-terminal-bg flex items-center justify-center">
                      <div className="text-center">
                        <FontAwesomeIcon icon={faSignal} className="w-8 h-8 text-terminal-accent mb-1" />
                        <div className="text-xs text-gray-400">Market Overview</div>
                      </div>
                    </div>
                    
                    {/* Content */}
                    <div className="p-3">
                      <div className="space-y-2 mb-3">
                        <div className="text-xs">
                          <span className="font-semibold text-terminal-accent">📈 Key Levels</span><br/>
                          • BTC Support: $92,000 | Resistance: $110,000<br/>
                          • Market sentiment: Moderately Bullish
                        </div>
                      </div>
                      
                      {/* Engagement */}
                      <div className="flex items-center justify-between text-xs text-gray-400 border-t border-terminal-border pt-2">
                        <div className="flex space-x-3">
                          <span>2,145 likes</span>
                          <span>123 comments</span>
                        </div>
                        <div className="text-xs text-gray-500">Dec 9</div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              
              {/* Research Update */}
              <div className="bg-terminal-bg rounded-lg p-4 border border-terminal-border">
                <h3 className="text-sm font-semibold text-terminal-accent mb-4 flex items-center">
                  <FontAwesomeIcon icon={faSignal} className="w-4 h-4 mr-2" />
                  Research Update
                </h3>
                <div className="space-y-3">
                  <div className="bg-terminal-panel rounded-lg p-3 border border-terminal-border">
                    <div className="text-sm font-medium text-terminal-accent mb-2">📊 Market Analysis</div>
                    <div className="text-xs text-gray-400 mb-2">BTC Dominance stabilizing above 50%</div>
                    <div className="text-xs text-gray-500">ETH network upgrades showing positive momentum</div>
                  </div>
                  
                  <div className="bg-terminal-panel rounded-lg p-3 border border-terminal-border">
                    <div className="text-sm font-medium text-terminal-accent mb-2">🔬 DeFi Research</div>
                    <div className="text-xs text-gray-400 mb-2">TVL growth in Layer 2 solutions</div>
                    <div className="text-xs text-gray-500">Yield farming strategies optimization</div>
                  </div>
                  
                  <div className="bg-terminal-panel rounded-lg p-3 border border-terminal-border">
                    <div className="text-sm font-medium text-terminal-accent mb-2">🌐 On-Chain Metrics</div>
                    <div className="text-xs text-gray-400 mb-2">Whale accumulation patterns detected</div>
                    <div className="text-xs text-gray-500">Exchange inflow/outflow analysis</div>
                  </div>
                </div>
              </div>
            </div>

            {/* Right Column - Indicators & Info */}
            <div className="space-y-4">
              <FearGreedIndex />
              
              {/* Altcoin Season / Bitcoin Season Index */}
              <div className="terminal-panel">
                <h2 className="terminal-header">🌊 Season Index</h2>
                
                {/* Calculate season index based on BTC dominance */}
                {marketData?.data && (() => {
                  const btcDom = marketData.data.market_cap_percentage.btc;
                  const isAltSeason = btcDom < 45;
                  const isBtcSeason = btcDom > 55;
                  
                  return (
                    <div className="space-y-3">
                      {/* Season Indicator */}
                      <div className="text-center">
                        <div className={`text-lg font-bold ${isAltSeason ? 'text-green-400' : isBtcSeason ? 'text-orange-400' : 'text-yellow-400'}`}>
                          {isAltSeason ? '🌊 Altcoin Season' : isBtcSeason ? '₿ Bitcoin Season' : '⚖️ Neutral'}
                        </div>
                        <div className="text-xs text-gray-400 mt-1">
                          BTC Dominance: {btcDom.toFixed(2)}%
                        </div>
                      </div>

                      {/* Season Meter */}
                      <div className="w-full">
                        <div className="flex justify-between text-xs text-gray-500 mb-2">
                          <span>Alt Season</span>
                          <span>Neutral</span>
                          <span>BTC Season</span>
                        </div>
                        <div className="h-2 rounded-full bg-gradient-to-r from-green-500 via-yellow-500 to-orange-500 relative">
                          <div 
                            className="absolute top-0 h-2 w-1 bg-white rounded-full transform -translate-x-1/2 shadow-lg"
                            style={{ left: `${btcDom}%` }}
                          ></div>
                        </div>
                        <div className="flex justify-between text-xs text-gray-400 mt-2">
                          <span>0%</span>
                          <span>45%</span>
                          <span>55%</span>
                          <span>100%</span>
                        </div>
                      </div>

                      {/* Season Analysis */}
                      <div className="bg-terminal-bg rounded-lg p-3 border border-terminal-border">
                        <div className="text-xs text-gray-400 mb-2">Analysis:</div>
                        <div className="text-xs text-gray-500">
                          {isAltSeason 
                            ? "Altcoins showing relative strength. Consider allocating to high-conviction alt projects."
                            : isBtcSeason
                            ? "Bitcoin dominance increasing. Focus on BTC accumulation and reduced alt exposure."
                            : "Market in balance. Maintain diversified portfolio across BTC and major alts."
                          }
                        </div>
                      </div>
                    </div>
                  );
                })()}
              </div>
              
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
          <div className="max-w-7xl mx-auto space-y-8">
            <OnChainAnalytics />
            <OnChainTransactions />
          </div>
        );

      case 'research':
        return <ResearchPage />;

      case 'learning':
        return <LearningPage />;

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
        <p className="mt-1">Data provided by CoinGecko, CoinDesk, Alternative.me, Mempool.space, Blockchain.com, and DeFi Llama</p>
        <div className="mt-2 flex items-center justify-center space-x-2">
          <a
            href="https://github.com/RAYDENFLY/quantumterminal"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center space-x-2 text-gray-400 hover:text-terminal-accent transition-colors"
          >
            <FontAwesomeIcon icon={faExternalLinkAlt} className="w-4 h-4" />
            <span>GitHub</span>
          </a>
          <span className="text-gray-600">•</span>
          <p className="font-bold text-terminal-accent">Quantum Terminal</p>
        </div>
      </footer>
    </div>
  );
}
