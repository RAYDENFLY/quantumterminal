'use client';

import { useState } from 'react';
import useSWR from 'swr';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faNewspaper, faArrowUp, faArrowDown, faMinus, faChevronLeft, faChevronRight } from '@fortawesome/free-solid-svg-icons';

const fetcher = (url: string) => fetch(url).then((res) => res.json());

interface NewsItem {
  id: string;
  title: string;
  published_at: string;
  domain: string;
  slug: string;
  kind: string;
  source?: {
    title: string;
    domain: string;
  };
  votes?: {
    positive: number;
    negative: number;
  };
}

interface NewsFeedProps {
  itemsPerPage?: number;
}

export default function NewsFeed({ itemsPerPage = 8 }: NewsFeedProps) {
  const [currentPage, setCurrentPage] = useState(1);

  const { data, error, isLoading } = useSWR<{ results: NewsItem[] }>(
    '/api/news',
    fetcher,
    { refreshInterval: 120000 } // 2 minutes
  );

  const getSentiment = (votes: { positive: number; negative: number } | undefined) => {
    if (!votes) return { icon: faMinus, color: 'text-gray-500', label: 'Neutral' };
    const total = votes.positive + votes.negative;
    if (total === 0) return { icon: faMinus, color: 'text-gray-500', label: 'Neutral' };
    
    const ratio = votes.positive / total;
    if (ratio > 0.6) return { icon: faArrowUp, color: 'text-terminal-success', label: 'Bullish' };
    if (ratio < 0.4) return { icon: faArrowDown, color: 'text-terminal-danger', label: 'Bearish' };
    return { icon: faMinus, color: 'text-yellow-400', label: 'Neutral' };
  };

  const getTimeAgo = (timestamp: string) => {
    const now = new Date().getTime();
    const published = new Date(timestamp).getTime();
    const diff = Math.floor((now - published) / 1000);

    if (diff < 60) return 'Just now';
    if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
    if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
    return `${Math.floor(diff / 86400)}d ago`;
  };

  const generateDescription = (title: string, domain: string) => {
    const lowerTitle = title.toLowerCase();

    // Generate relevant description based on keywords in title
    if (lowerTitle.includes('bitcoin') || lowerTitle.includes('btc')) {
      if (lowerTitle.includes('surge') || lowerTitle.includes('rally') || lowerTitle.includes('high')) {
        return "Bitcoin continues its upward momentum with significant price movements. Market participants are closely watching this development for potential broader market implications.";
      }
      if (lowerTitle.includes('crash') || lowerTitle.includes('drop') || lowerTitle.includes('fall')) {
        return "Bitcoin experiences downward pressure as market sentiment shifts. Investors are monitoring key support levels and potential recovery catalysts.";
      }
      if (lowerTitle.includes('halving')) {
        return "Bitcoin halving event approaches, potentially impacting supply dynamics and long-term price projections for the leading cryptocurrency.";
      }
      return "Latest developments in Bitcoin market with analysis of price action, on-chain metrics, and institutional adoption trends.";
    }

    if (lowerTitle.includes('ethereum') || lowerTitle.includes('eth')) {
      if (lowerTitle.includes('upgrade') || lowerTitle.includes('merge')) {
        return "Ethereum network upgrade brings significant improvements to scalability, security, and energy efficiency for the smart contract platform.";
      }
      if (lowerTitle.includes('staking') || lowerTitle.includes('pos')) {
        return "Ethereum's transition to proof-of-stake continues to evolve with increasing validator participation and network decentralization.";
      }
      return "Ethereum ecosystem developments including DeFi protocols, NFT markets, and layer-2 scaling solutions.";
    }

    if (lowerTitle.includes('defi') || lowerTitle.includes('yield')) {
      return "Decentralized finance protocols continue to innovate with new yield farming strategies and liquidity provision mechanisms.";
    }

    if (lowerTitle.includes('nft') || lowerTitle.includes('collectible')) {
      return "NFT market dynamics shift with emerging use cases in gaming, metaverse, and digital ownership verification.";
    }

    if (lowerTitle.includes('regulation') || lowerTitle.includes('sec') || lowerTitle.includes('government')) {
      return "Regulatory developments shape the future of cryptocurrency adoption with potential impacts on market structure and compliance requirements.";
    }

    if (lowerTitle.includes('mining') || lowerTitle.includes('miner')) {
      return "Cryptocurrency mining landscape evolves with technological advancements and changing network economics.";
    }

    if (lowerTitle.includes('exchange') || lowerTitle.includes('trading')) {
      return "Cryptocurrency exchanges adapt to market demands with new features, security enhancements, and regulatory compliance measures.";
    }

    if (lowerTitle.includes('adoption') || lowerTitle.includes('institutional')) {
      return "Institutional and corporate adoption of cryptocurrencies accelerates with new partnerships and investment vehicles.";
    }

    // Generic descriptions based on news source
    if (domain.includes('coindesk')) {
      return "Comprehensive analysis and breaking news from one of the most trusted sources in cryptocurrency journalism.";
    }
    if (domain.includes('cointelegraph')) {
      return "In-depth coverage of blockchain technology, cryptocurrency markets, and emerging trends in digital finance.";
    }
    if (domain.includes('bloomberg')) {
      return "Financial market perspective on cryptocurrency trends, institutional adoption, and macroeconomic implications.";
    }

    // Default description
    return "Breaking developments in the cryptocurrency and blockchain space with potential market impact and industry implications.";
  };

  // Pagination logic
  const totalItems = data?.results?.length || 0;
  const totalPages = Math.ceil(totalItems / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentItems = data?.results?.slice(startIndex, endIndex) || [];

  const goToPage = (page: number) => {
    setCurrentPage(Math.max(1, Math.min(page, totalPages)));
  };

  const goToPrevious = () => {
    setCurrentPage(prev => Math.max(1, prev - 1));
  };

  const goToNext = () => {
    setCurrentPage(prev => Math.min(totalPages, prev + 1));
  };

  return (
    <>
      {isLoading ? (
        <div className="space-y-4">
          {[...Array(8)].map((_, i) => (
            <div key={i} className="terminal-panel animate-pulse">
              <div className="h-24 bg-terminal-bg rounded"></div>
            </div>
          ))}
        </div>
      ) : error || !data ? (
        <div className="terminal-panel text-center py-8">
          <div className="text-terminal-danger text-sm">Failed to load news</div>
        </div>
      ) : (
        <div className="space-y-4">
          {currentItems.map((news) => {
            const sentiment = getSentiment(news.votes);

            return (
              <div
                key={news.id}
                className="terminal-panel hover:border-terminal-accent transition-colors cursor-pointer"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-3 mb-3">
                      <div className={`flex items-center space-x-1 text-sm ${sentiment.color}`}>
                        <FontAwesomeIcon icon={sentiment.icon} className="w-4 h-4" />
                        <span className="font-medium">{sentiment.label}</span>
                      </div>
                      <span className="text-xs text-gray-500">•</span>
                      <span className="text-xs text-gray-500">{getTimeAgo(news.published_at)}</span>
                    </div>

                    <h3 className="font-bold text-lg text-terminal-text mb-2 line-clamp-2">
                      {news.title}
                    </h3>

                    <p className="text-gray-400 text-sm mb-3 line-clamp-3">
                      {generateDescription(news.title, news.source?.domain || news.domain)}
                    </p>

                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <span className="text-xs text-gray-500 bg-terminal-bg px-2 py-1 rounded">
                          {news.source?.title || news.domain}
                        </span>
                        <span className="text-xs text-terminal-accent">
                          {news.kind === 'news' ? '📰 News' : '📈 Update'}
                        </span>
                      </div>

                      <div className="text-xs text-gray-500">
                        {news.votes ? `${news.votes.positive + news.votes.negative} votes` : 'No votes'}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between mt-6 pt-4 border-t border-terminal-border">
              <div className="text-sm text-gray-500">
                Showing {startIndex + 1}-{Math.min(endIndex, totalItems)} of {totalItems} articles
              </div>

              <div className="flex items-center space-x-2">
                <button
                  onClick={goToPrevious}
                  disabled={currentPage === 1}
                  className={`px-3 py-1 rounded text-sm transition-colors ${
                    currentPage === 1
                      ? 'text-gray-600 cursor-not-allowed'
                      : 'text-terminal-accent hover:bg-terminal-bg cursor-pointer'
                  }`}
                >
                  <FontAwesomeIcon icon={faChevronLeft} className="w-3 h-3 mr-1" />
                  Previous
                </button>

                <div className="flex items-center space-x-1">
                  {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                    const pageNum = Math.max(1, Math.min(totalPages - 4, currentPage - 2)) + i;
                    if (pageNum > totalPages) return null;

                    return (
                      <button
                        key={pageNum}
                        onClick={() => goToPage(pageNum)}
                        className={`px-3 py-1 rounded text-sm transition-colors ${
                          currentPage === pageNum
                            ? 'bg-terminal-accent text-terminal-bg'
                            : 'text-gray-400 hover:text-terminal-text hover:bg-terminal-bg'
                        }`}
                      >
                        {pageNum}
                      </button>
                    );
                  })}
                </div>

                <button
                  onClick={goToNext}
                  disabled={currentPage === totalPages}
                  className={`px-3 py-1 rounded text-sm transition-colors ${
                    currentPage === totalPages
                      ? 'text-gray-600 cursor-not-allowed'
                      : 'text-terminal-accent hover:bg-terminal-bg cursor-pointer'
                  }`}
                >
                  Next
                  <FontAwesomeIcon icon={faChevronRight} className="w-3 h-3 ml-1" />
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </>
  );
}
