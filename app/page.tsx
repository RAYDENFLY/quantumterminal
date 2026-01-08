'use client';

import { useEffect, useState } from 'react';
import TopBar from '@/components/TopBar';
import MarketOverview from '@/components/MarketOverview';
import NewsFeed from '@/components/NewsFeed';
import FearGreedIndex from '@/components/FearGreedIndex';
import TopGainersLosers from '@/components/TopGainersLosers';
import OnChainAnalytics from '@/components/OnChainAnalytics';
import OnChainTransactions from '@/components/OnChainTransactions';
import NotificationModal from '@/components/NotificationModal';
import ResearchPage from '@/components/ResearchPage';
import LearningPage from '@/components/LearningPage';
import SubmissionsPage from '@/app/submissions/page';
import { useHotkeys } from '@/hooks/useHotkeys';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faArrowUp, faArrowDown, faMinus, faSignal, faExternalLinkAlt, faPlus } from '@fortawesome/free-solid-svg-icons';
import useSWR from 'swr';
import Link from 'next/link';

const fetcher = (url: string) => fetch(url).then((res) => res.json());

function proxiedImageSrc(url: string) {
  const raw = String(url || '');
  if (!raw) return '';
  // Only proxy ImgBB images; leave other sources untouched.
  if (/^https:\/\/(?:i\.ibb\.co|ibb\.co|image\.ibb\.co)\//i.test(raw)) {
    return `/api/image-proxy?url=${encodeURIComponent(raw)}`;
  }
  return raw;
}

export default function Home() {
  const [activeModule, setActiveModule] = useState<string>('market');
  const [showTradingSignalForm, setShowTradingSignalForm] = useState(false);
  const [showMarketUpdateForm, setShowMarketUpdateForm] = useState(false);
  const [uploadingMarketImage, setUploadingMarketImage] = useState(false);
  const [marketUpdatePreviewError, setMarketUpdatePreviewError] = useState(false);
  
  // Notification modal state
  const [notification, setNotification] = useState({
    isOpen: false,
    type: 'success' as 'success' | 'error' | 'warning' | 'info' | 'loading',
    title: '',
    message: ''
  });
  const [tradingSignalForm, setTradingSignalForm] = useState({
    author: '',
    asset: '',
    direction: 'LONG',
    tradingStyle: 'swing-trade',
    conviction: 5,
    entryPrice: '',
    stopLoss: '',
    takeProfit1: '',
    takeProfit2: '',
    takeProfit3: '',
    reasoning: '',
    image: ''
  });
  const [marketUpdateForm, setMarketUpdateForm] = useState({
    title: '',
    content: '',
    imageUrl: '',
    author: ''
  });

  const handleMarketUpdateImageUpload = async (file: File) => {
    if (!file) return;
    setUploadingMarketImage(true);
    showNotification('loading', 'Uploading Image', 'Uploading image to ImgBB...');
    try {
      const fd = new FormData();
      fd.append('file', file);

      const res = await fetch('/api/upload/imgbb', { method: 'POST', body: fd });
      const json = (await res.json().catch(() => null)) as any;
      if (!res.ok || !json?.success || !json?.data?.url) {
        showNotification('error', 'Upload Failed', json?.error || 'Failed to upload image.');
        return;
      }

      setMarketUpdateForm((prev) => ({ ...prev, imageUrl: String(json.data.url) }));
  setMarketUpdatePreviewError(false);
      showNotification('success', 'Upload Complete', 'Image uploaded successfully.');
    } catch {
      showNotification('error', 'Network Error', 'Failed to upload image. Please try again.');
    } finally {
      setUploadingMarketImage(false);
    }
  };

  // Fetch market data for trading signals
  const { data: marketData } = useSWR('/api/global-market', fetcher, { refreshInterval: 60000 });

  // Fetch current user (for submissions author)
  const { data: meData } = useSWR('/api/auth/me', fetcher);

  // Auto-fill author from session (still editable in the form)
  useEffect(() => {
    const meUser = meData?.success ? meData.user : null;
    const suggested = meUser?.username || meUser?.email;
    if (!suggested) return;
    setMarketUpdateForm((prev) => (prev.author ? prev : { ...prev, author: String(suggested) }));
  }, [meData]);

  // Allow deep-linking to a specific module, e.g. /?module=news
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const sp = new URLSearchParams(window.location.search);
    const mod = sp.get('module');
    if (!mod) return;
    const allowed = new Set(['market', 'news', 'onchain', 'research', 'learning', 'submissions']);
    if (allowed.has(mod) && mod !== activeModule) {
      setActiveModule(mod);
    }
    // Only run on initial load.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Fetch trading signals from database
  const { data: tradingSignalsData, mutate: mutateTradingSignals } = useSWR('/api/trading-signals', fetcher, { refreshInterval: 60000 });

  // Fetch market updates from database
  const { data: marketUpdatesData, mutate: mutateMarketUpdates } = useSWR('/api/market-update', fetcher, { refreshInterval: 60000 });

  // Fetch research papers from database
  const { data: researchData } = useSWR('/api/research', fetcher, { refreshInterval: 300000 });

  // Transform trading signals data for UI
  const tradingSignals = (tradingSignalsData?.data || []).map((signal: any) => ({
    ...signal,
    icon: signal.signal === 'LONG' ? faArrowUp : faArrowDown,
    color: signal.signal === 'LONG' ? 'text-terminal-success' : 'text-terminal-danger',
    direction: signal.signal,
    strength: `Author: ${signal.author}`,
    reason: `Conviction: ${signal.conviction}/10`,
    status: signal.signalStatus || 'Running',
    entry: signal.entry,
    sl: signal.stopLoss,
    tp1: signal.takeProfit1,
    tp2: signal.takeProfit2,
    tp3: signal.takeProfit3
  }));

  // Notification helper function
  const showNotification = (type: 'success' | 'error' | 'warning' | 'info' | 'loading', title: string, message: string) => {
    setNotification({
      isOpen: true,
      type,
      title,
      message
    });
  };

  const closeNotification = () => {
    setNotification(prev => ({ ...prev, isOpen: false }));
  };

  // Handle trading signal form submission
  const handleTradingSignalSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Show loading notification
    showNotification('loading', 'Submitting Signal', 'Please wait while we process your trading signal...');
    
    try {
      const response = await fetch('/api/trading-signals', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(tradingSignalForm),
      });

      if (response.ok) {
        showNotification(
          'success', 
          'Signal Submitted Successfully!', 
          'Your trading signal has been submitted for admin review. You will be notified once it\'s approved and published.'
        );
        setShowTradingSignalForm(false);
        setTradingSignalForm({
          author: '',
          asset: '',
          direction: 'LONG',
          tradingStyle: 'swing-trade',
          conviction: 5,
          entryPrice: '',
          stopLoss: '',
          takeProfit1: '',
          takeProfit2: '',
          takeProfit3: '',
          reasoning: '',
          image: ''
        });
      } else {
        const errorData = await response.json();
        showNotification(
          'error', 
          'Submission Failed', 
          errorData.error || 'Failed to submit trading signal. Please check your input and try again.'
        );
      }
    } catch (error) {
      showNotification(
        'error', 
        'Network Error', 
        'Failed to submit trading signal. Please check your internet connection and try again.'
      );
    }
  };

  // Handle market update form submission
  const handleMarketUpdateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Show loading notification
    showNotification('loading', 'Submitting Update', 'Please wait while we process your market update...');
    
    try {
      const meUser = meData?.success ? meData.user : null;
      const author = marketUpdateForm.author?.trim() || meUser?.username || meUser?.email;
      if (!author) {
        showNotification('error', 'Submission Failed', 'Author / Name is required.');
        return;
      }

      const response = await fetch('/api/market-update', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          title: marketUpdateForm.title,
          content: marketUpdateForm.content,
          author,
          type: 'analysis',
          imageUrl: marketUpdateForm.imageUrl || undefined,
        }),
      });

      if (response.ok) {
        showNotification(
          'success', 
          'Update Submitted Successfully!', 
          'Your market update has been submitted for admin review. You will be notified once it\'s approved and published.'
        );
        setShowMarketUpdateForm(false);
        setMarketUpdateForm({
          title: '',
          content: '',
          imageUrl: '',
          author: ''
        });
  setMarketUpdatePreviewError(false);
        mutateMarketUpdates();
      } else {
        const errorData = await response.json();
        showNotification(
          'error', 
          'Submission Failed', 
          errorData.error || 'Failed to submit market update. Please check your input and try again.'
        );
      }
    } catch (error) {
      showNotification(
        'error', 
        'Network Error', 
        'Failed to submit market update. Please check your internet connection and try again.'
      );
    }
  };

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
              <div className="bg-terminal-bg rounded-lg p-4 border border-terminal-border">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-sm font-semibold text-terminal-accent flex items-center">
                    <FontAwesomeIcon icon={faSignal} className="w-4 h-4 mr-2" />
                    Trading Signals
                  </h3>
                  <button
                    onClick={() => setShowTradingSignalForm(true)}
                    className="flex items-center space-x-1 text-xs bg-terminal-accent text-black px-2 py-1 rounded hover:bg-terminal-accent/80 transition-colors"
                  >
                    <FontAwesomeIcon icon={faPlus} className="w-3 h-3" />
                    <span>Add Signal</span>
                  </button>
                </div>
                <p className="text-xs text-gray-400 mb-4 leading-relaxed">
                  Selalu ingat bahwa trading futures memiliki risiko yang sangat tinggi. Seluruh chart, analisis, atau pandangan yang saya bagikan bukan merupakan ajakan atau saran investasi. Semua hanyalah hasil dari analisis pribadi yang bisa saja salah.<br/><br/>
                  Profit maupun kerugian menjadi tanggung jawab masing-masing trader.<br/>
                  Pastikan selalu menggunakan Risk Management yang baik dan tidak pernah menggunakan dana yang kamu tidak siap kehilangannya.
                </p>
                {tradingSignals.length > 0 ? (
                  <div className="flex gap-4 overflow-x-auto pb-2">
                    {tradingSignals.map((signal: any, index: number) => (
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
                        <div className="text-xs text-gray-400 mb-1">{signal.strength}</div>
                        <div className="text-xs text-gray-500 mb-3">{signal.reason}</div>
                        
                        {/* Analysis Image */}
                        {signal.imageUrl && (
                          <div className="mb-3">
                            <img 
                              src={signal.imageUrl} 
                              alt="Signal Analysis"
                              className="w-full h-24 object-cover rounded border border-terminal-border"
                              onError={(e) => {
                                const target = e.target as HTMLImageElement;
                                target.style.display = 'none';
                              }}
                            />
                          </div>
                        )}
                        
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
                ) : (
                  <div className="text-center text-gray-400 text-sm py-8">
                    No trading signals available. Be the first to add one!
                  </div>
                )}
              </div>
              
              {/* Market Update */}
              <div className="bg-terminal-bg rounded-lg p-4 border border-terminal-border">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-sm font-semibold text-terminal-accent flex items-center">
                    <FontAwesomeIcon icon={faSignal} className="w-4 h-4 mr-2" />
                    Market Update
                  </h3>
                  <button
                    onClick={() => setShowMarketUpdateForm(true)}
                    className="flex items-center space-x-1 text-xs bg-terminal-accent text-black px-2 py-1 rounded hover:bg-terminal-accent/80 transition-colors"
                  >
                    <FontAwesomeIcon icon={faPlus} className="w-3 h-3" />
                    <span>Add Update</span>
                  </button>
                </div>
                
        {Array.isArray(marketUpdatesData?.data) && marketUpdatesData.data.length > 0 ? (
                  <div className="flex gap-4 overflow-x-auto pb-2">
                    {marketUpdatesData.data.map((update: any, index: number) => {
                      const updateId = update?._id ?? update?.id;
                      const Wrapper: any = updateId ? Link : 'div';
                      const wrapperProps = updateId
                        ? {
                            href: `/market-update/${encodeURIComponent(String(updateId))}`,
                          }
                        : {};

                      return (
                      <Wrapper
                        key={updateId || index}
                        {...wrapperProps}
                        className="bg-terminal-panel rounded-lg border border-terminal-border flex-shrink-0 w-80 overflow-hidden hover:border-terminal-accent transition-colors"
                      >
                        {/* Header */}
                        <div className="p-3 border-b border-terminal-border">
                          <div className="flex items-center space-x-3">
                            <div className="w-6 h-6 bg-terminal-accent rounded-full flex items-center justify-center">
                              <span className="text-xs font-bold text-black">
                                {update.author?.charAt(0)?.toUpperCase() || 'U'}
                              </span>
                            </div>
                            <div>
                              <div className="text-xs font-semibold text-terminal-accent">
                                {update.author || 'Anonymous'}
                              </div>
                              <div className="text-xs text-gray-400">
                                {new Date(update.createdAt).toLocaleDateString()}
                              </div>
                            </div>
                          </div>
                        </div>
                        
                        {/* Image */}
                        {update.imageUrl ? (
                          <div className="aspect-[16/9] bg-terminal-bg overflow-hidden">
                            <img 
                              src={proxiedImageSrc(update.imageUrl)} 
                              alt={update.title}
                              className="w-full h-full object-cover"
                            />
                          </div>
                        ) : (
                          <div className="aspect-[16/9] bg-terminal-bg flex items-center justify-center">
                            <div className="text-center">
                              <FontAwesomeIcon icon={faSignal} className="w-8 h-8 text-terminal-accent mb-1" />
                              <div className="text-xs text-gray-400">Market Analysis</div>
                            </div>
                          </div>
                        )}
                        
                        {/* Content */}
                        <div className="p-3">
                          <div className="mb-3">
                            <div className="text-sm font-semibold text-terminal-accent mb-2">
                              {update.title}
                            </div>
                            <div className="text-xs text-gray-300 leading-relaxed">
                              {update.content.length > 150 
                                ? `${update.content.substring(0, 150)}...` 
                                : update.content
                              }
                            </div>
                          </div>
                          
                          {/* Engagement */}
                          <div className="flex items-center justify-between text-xs text-gray-400 border-t border-terminal-border pt-2">
                            <div className="flex space-x-3">
                              <span>Market Update</span>
                            </div>
                            <div className="text-xs text-gray-500">
                              {new Date(update.createdAt).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                            </div>
                          </div>
                        </div>
                      </Wrapper>
                      );
                    })}
                  </div>
                ) : (
                  <div className="text-center text-gray-400 text-sm py-8">
                    No market updates available. Be the first to share market insights!
                  </div>
                )}
              </div>
              
              {/* Research Update */}
              <div className="bg-terminal-bg rounded-lg p-4 border border-terminal-border">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-sm font-semibold text-terminal-accent flex items-center">
                    <FontAwesomeIcon icon={faSignal} className="w-4 h-4 mr-2" />
                    Research Update
                  </h3>
                  <div className="flex items-center gap-2">
                    <div className="text-xs text-gray-500">
                      {researchData ? `${researchData?.research?.length || 0} papers` : 'Loading...'}
                    </div>
                  </div>
                </div>
                {!researchData ? (
                  <div className="text-center text-gray-400 text-sm py-4">
                    <div className="animate-pulse">Loading research papers...</div>
                  </div>
                ) : researchData?.research?.length > 0 ? (
                  <div className="space-y-3">
                    {researchData.research.slice(0, 3).map((research: any, index: number) => (
                      <div key={research._id || index} className="bg-terminal-panel rounded-lg p-3 border border-terminal-border">
                        <div className="text-sm font-medium text-terminal-accent mb-2">
                          📊 {research.title}
                        </div>
                        <div className="text-xs text-gray-400 mb-2">
                          By {research.author} • {new Date(research.createdAt).toLocaleDateString()}
                        </div>
                        <div className="text-xs text-gray-500 mb-2">
                          {research.description 
                            ? (research.description.length > 120 
                                ? `${research.description.substring(0, 120)}...` 
                                : research.description)
                            : 'No description available'
                          }
                        </div>
                        {research.tags && research.tags.length > 0 && (
                          <div className="flex flex-wrap gap-1 mb-2">
                            {research.tags.slice(0, 2).map((tag: string, tagIndex: number) => (
                              <span key={tagIndex} className="text-xs bg-terminal-accent/10 text-terminal-accent px-2 py-1 rounded">
                                {tag}
                              </span>
                            ))}
                          </div>
                        )}
                        <div className="flex items-center justify-between mt-2 pt-2 border-t border-terminal-border">
                          <div className="text-xs text-gray-400">
                            Research Paper
                          </div>
                          <a 
                            href={research.link} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="text-xs text-terminal-accent hover:text-terminal-accent/80 transition-colors"
                          >
                            Read more →
                          </a>
                        </div>
                      </div>
                    ))}
                    {researchData.research.length > 3 && (
                      <div className="text-center pt-2">
                        <a 
                          href="#research"
                          onClick={() => setActiveModule('research')}
                          className="text-xs text-terminal-accent hover:text-terminal-accent/80 cursor-pointer"
                        >
                          View all {researchData.research.length} research papers →
                        </a>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="text-center text-gray-400 text-sm py-8">
                    <div className="mb-2">📚</div>
                    <div className="font-medium mb-1">No research papers yet</div>
                    <div className="text-xs">
                      Be the first to submit research papers for the community!
                    </div>
                    <button
                      onClick={() => setActiveModule('research')}
                      className="mt-3 text-xs bg-terminal-accent/10 text-terminal-accent px-3 py-1 rounded hover:bg-terminal-accent/20 transition-colors"
                    >
                      Submit Research →
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* Right Column - Fear & Greed Index and News */}
            <div className="space-y-4">
              <FearGreedIndex />
              
              {/* Season Index */}
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
          <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
            <div className="lg:col-span-3">
              <NewsFeed />
            </div>
            <div className="lg:col-span-2 space-y-4">
              <FearGreedIndex />
              <MarketOverview />
            </div>
          </div>
        );

      case 'onchain':
        return (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <OnChainAnalytics />
            <OnChainTransactions />
          </div>
        );

      case 'research':
        return <ResearchPage />;

      case 'learning':
        return <LearningPage />;

      case 'submissions':
        return <SubmissionsPage />;

      default:
        return (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            <div className="lg:col-span-2 space-y-4">
              <MarketOverview />
              <TopGainersLosers />
            </div>
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

      {/* Trading Signal Form Modal */}
      {showTradingSignalForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-terminal-bg border border-terminal-border rounded-lg w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-terminal-accent">Submit Trading Signal</h2>
                <button
                  onClick={() => setShowTradingSignalForm(false)}
                  className="text-gray-400 hover:text-white"
                >
                  <FontAwesomeIcon icon={faMinus} className="w-4 h-4" />
                </button>
              </div>

              <form onSubmit={handleTradingSignalSubmit} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-terminal-accent mb-2">
                      Author / Name *
                    </label>
                    <input
                      type="text"
                      value={tradingSignalForm.author}
                      onChange={(e) => setTradingSignalForm({ ...tradingSignalForm, author: e.target.value })}
                      className="w-full px-3 py-2 bg-terminal-panel border border-terminal-border rounded text-terminal-accent placeholder-gray-400"
                      placeholder="Your name or handle"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-terminal-accent mb-2">
                      Asset Symbol *
                    </label>
                    <input
                      type="text"
                      value={tradingSignalForm.asset}
                      onChange={(e) => setTradingSignalForm({ ...tradingSignalForm, asset: e.target.value.toUpperCase() })}
                      className="w-full px-3 py-2 bg-terminal-panel border border-terminal-border rounded text-terminal-accent placeholder-gray-400"
                      placeholder="BTC, ETH, SOL..."
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-terminal-accent mb-2">
                      Direction *
                    </label>
                    <select
                      value={tradingSignalForm.direction}
                      onChange={(e) => setTradingSignalForm({ ...tradingSignalForm, direction: e.target.value })}
                      className="w-full px-3 py-2 bg-terminal-panel border border-terminal-border rounded text-terminal-accent"
                      required
                    >
                      <option value="LONG">LONG</option>
                      <option value="SHORT">SHORT</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-terminal-accent mb-2">
                      Trading Style *
                    </label>
                    <select
                      value={tradingSignalForm.tradingStyle}
                      onChange={(e) => setTradingSignalForm({ ...tradingSignalForm, tradingStyle: e.target.value })}
                      className="w-full px-3 py-2 bg-terminal-panel border border-terminal-border rounded text-terminal-accent"
                      required
                    >
                      <option value="swing-trade">Swing Trade</option>
                      <option value="scalping">Scalping</option>
                      <option value="position-trading">Position Trading</option>
                      <option value="long-term-investing">Long Term Investing</option>
                      <option value="trend-following">Trend Following</option>
                      <option value="mean-reversion">Mean Reversion</option>
                      <option value="range-trading">Range Trading</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-terminal-accent mb-2">
                      Conviction (1-10) *
                    </label>
                    <input
                      type="number"
                      min="1"
                      max="10"
                      value={tradingSignalForm.conviction}
                      onChange={(e) => setTradingSignalForm({ ...tradingSignalForm, conviction: Number(e.target.value) })}
                      className="w-full px-3 py-2 bg-terminal-panel border border-terminal-border rounded text-terminal-accent"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-terminal-accent mb-2">
                      Entry Price *
                    </label>
                    <input
                      type="text"
                      value={tradingSignalForm.entryPrice}
                      onChange={(e) => setTradingSignalForm({ ...tradingSignalForm, entryPrice: e.target.value })}
                      className="w-full px-3 py-2 bg-terminal-panel border border-terminal-border rounded text-terminal-accent"
                      placeholder="$95,000 - $98,000"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-terminal-accent mb-2">
                      Stop Loss *
                    </label>
                    <input
                      type="text"
                      value={tradingSignalForm.stopLoss}
                      onChange={(e) => setTradingSignalForm({ ...tradingSignalForm, stopLoss: e.target.value })}
                      className="w-full px-3 py-2 bg-terminal-panel border border-terminal-border rounded text-terminal-accent"
                      placeholder="$92,000"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-terminal-accent mb-2">
                      Take Profit 1 *
                    </label>
                    <input
                      type="text"
                      value={tradingSignalForm.takeProfit1}
                      onChange={(e) => setTradingSignalForm({ ...tradingSignalForm, takeProfit1: e.target.value })}
                      className="w-full px-3 py-2 bg-terminal-panel border border-terminal-border rounded text-terminal-accent"
                      placeholder="$110,000"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-terminal-accent mb-2">
                      Take Profit 2
                    </label>
                    <input
                      type="text"
                      value={tradingSignalForm.takeProfit2}
                      onChange={(e) => setTradingSignalForm({ ...tradingSignalForm, takeProfit2: e.target.value })}
                      className="w-full px-3 py-2 bg-terminal-panel border border-terminal-border rounded text-terminal-accent"
                      placeholder="$125,000"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-terminal-accent mb-2">
                      Take Profit 3
                    </label>
                    <input
                      type="text"
                      value={tradingSignalForm.takeProfit3}
                      onChange={(e) => setTradingSignalForm({ ...tradingSignalForm, takeProfit3: e.target.value })}
                      className="w-full px-3 py-2 bg-terminal-panel border border-terminal-border rounded text-terminal-accent"
                      placeholder="$140,000"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-terminal-accent mb-2">
                      Image Analysis (Optional)
                    </label>
                    <input
                      type="url"
                      value={tradingSignalForm.image || ''}
                      onChange={(e) => setTradingSignalForm({ ...tradingSignalForm, image: e.target.value })}
                      className="w-full px-3 py-2 bg-terminal-panel border border-terminal-border rounded text-terminal-accent placeholder-gray-400"
                      placeholder="https://example.com/chart-image.jpg"
                    />
                    <p className="text-xs text-gray-400 mt-1">URL to chart or analysis image</p>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-terminal-accent mb-2">
                    Reasoning / Analysis *
                  </label>
                  <textarea
                    value={tradingSignalForm.reasoning}
                    onChange={(e) => setTradingSignalForm({ ...tradingSignalForm, reasoning: e.target.value })}
                    className="w-full px-3 py-2 bg-terminal-panel border border-terminal-border rounded text-terminal-accent placeholder-gray-400 resize-none"
                    rows={4}
                    placeholder="Explain your analysis, chart patterns, indicators, or reasoning behind this signal..."
                    required
                  />
                </div>

                <div className="pt-4 border-t border-terminal-border">
                  <p className="text-xs text-gray-400 mb-4">
                    Signal will be reviewed by admin before being published.
                  </p>
                  <div className="flex justify-end gap-3">
                    <button
                      type="button"
                      onClick={() => setShowTradingSignalForm(false)}
                      className="px-6 py-2 text-sm border border-terminal-border rounded hover:bg-terminal-panel transition-colors text-gray-300"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="px-6 py-2 text-sm bg-terminal-accent text-black rounded hover:bg-terminal-accent/80 transition-colors font-medium"
                    >
                      Submit Signal
                    </button>
                  </div>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Market Update Form Modal */}
      {showMarketUpdateForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-terminal-bg border border-terminal-border rounded-lg w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-terminal-accent">Submit Market Update</h2>
                <button
                  onClick={() => setShowMarketUpdateForm(false)}
                  className="text-gray-400 hover:text-white"
                >
                  <FontAwesomeIcon icon={faMinus} className="w-4 h-4" />
                </button>
              </div>

              <form onSubmit={handleMarketUpdateSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-terminal-accent mb-2">Author / Name *</label>
                  <input
                    type="text"
                    value={marketUpdateForm.author}
                    onChange={(e) => setMarketUpdateForm({ ...marketUpdateForm, author: e.target.value })}
                    className="w-full px-3 py-2 bg-terminal-panel border border-terminal-border rounded text-terminal-accent placeholder-gray-400"
                    placeholder="Your name or handle"
                    required
                  />
                  <p className="text-xs text-gray-400 mt-1">Auto-filled from your account; you can edit it.</p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-terminal-accent mb-2">
                    Title *
                  </label>
                  <input
                    type="text"
                    value={marketUpdateForm.title}
                    onChange={(e) => setMarketUpdateForm({ ...marketUpdateForm, title: e.target.value })}
                    className="w-full px-3 py-2 bg-terminal-panel border border-terminal-border rounded text-terminal-accent placeholder-gray-400"
                    placeholder="Market update title..."
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-terminal-accent mb-2">Image (optional)</label>
                  <div className="space-y-2">
                    <input
                      type="file"
                      accept="image/*"
                      className="w-full text-xs text-gray-300"
                      disabled={uploadingMarketImage}
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (!file) return;
                        handleMarketUpdateImageUpload(file);
                        // allow choosing the same file again
                        e.currentTarget.value = '';
                      }}
                    />

                    <input
                      type="url"
                      value={marketUpdateForm.imageUrl}
                      onChange={(e) => {
                        setMarketUpdateForm({ ...marketUpdateForm, imageUrl: e.target.value });
                        setMarketUpdatePreviewError(false);
                      }}
                      className="w-full px-3 py-2 bg-terminal-panel border border-terminal-border rounded text-terminal-accent placeholder-gray-400"
                      placeholder="Image URL (auto filled after upload, or paste URL here)"
                    />

                    {marketUpdateForm.imageUrl ? (
                      <div className="rounded-md border border-terminal-border bg-terminal-panel p-2">
                        <div className="text-xs text-gray-400 mb-2">Preview:</div>
                        {marketUpdatePreviewError ? (
                          <div className="text-xs text-gray-300">
                            Preview failed to load. 
                            <a
                              href={marketUpdateForm.imageUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="ml-1 text-terminal-accent hover:underline"
                            >
                              Open image in new tab →
                            </a>
                          </div>
                        ) : (
                          <img
                            src={proxiedImageSrc(marketUpdateForm.imageUrl)}
                            alt="Market update preview"
                            className="max-h-48 w-full object-contain rounded"
                            onError={() => setMarketUpdatePreviewError(true)}
                            onLoad={() => setMarketUpdatePreviewError(false)}
                          />
                        )}
                      </div>
                    ) : null}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-terminal-accent mb-2">
                    Content *
                  </label>
                  <textarea
                    value={marketUpdateForm.content}
                    onChange={(e) => setMarketUpdateForm({ ...marketUpdateForm, content: e.target.value })}
                    className="w-full px-3 py-2 bg-terminal-panel border border-terminal-border rounded text-terminal-accent placeholder-gray-400 resize-none"
                    rows={6}
                    placeholder="Share your market insights, analysis, trends, or important updates..."
                    required
                  />
                </div>

                <div className="pt-4 border-t border-terminal-border">
                  <p className="text-xs text-gray-400 mb-4">
                    Market update will be reviewed by admin before being published.
                  </p>
                  <div className="flex justify-end gap-3">
                    <button
                      type="button"
                      onClick={() => setShowMarketUpdateForm(false)}
                      className="px-6 py-2 text-sm border border-terminal-border rounded hover:bg-terminal-panel transition-colors text-gray-300"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="px-6 py-2 text-sm bg-terminal-accent text-black rounded hover:bg-terminal-accent/80 transition-colors font-medium"
                    >
                      Submit Update
                    </button>
                  </div>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Notification Modal */}
      <NotificationModal
        isOpen={notification.isOpen}
        onClose={closeNotification}
        type={notification.type}
        title={notification.title}
        message={notification.message}
      />
    </div>
  );
}
