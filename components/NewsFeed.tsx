'use client';

import { useState } from 'react';
import useSWR from 'swr';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faChevronLeft, faChevronRight } from '@fortawesome/free-solid-svg-icons';

const fetcher = (url: string) => fetch(url).then((res) => res.json());

interface NewsItem {
  id: string;
  title: string;
  published_at: string;
  domain: string;
  slug: string;
  link: string;
  kind: string;
  source?: {
    title: string;
    domain: string;
  };
}

interface NewsFeedProps {
  itemsPerPage?: number;
}

export default function NewsFeed({ itemsPerPage = 7 }: NewsFeedProps) {
  const [currentPage, setCurrentPage] = useState(1);

  const { data, error, isLoading } = useSWR<{ results: NewsItem[] }>(
    '/api/news',
    fetcher,
    { refreshInterval: 120000 } // 2 minutes
  );

  const getTimeAgo = (timestamp: string) => {
    const now = new Date().getTime();
    const published = new Date(timestamp).getTime();
    const diff = Math.floor((now - published) / 1000);

    if (diff < 60) return 'Just now';
    if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
    if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
    return `${Math.floor(diff / 86400)}d ago`;
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
            return (
              <div
                key={news.id}
                className="terminal-panel hover:border-terminal-accent transition-colors cursor-pointer"
                onClick={() => window.open(news.link, '_blank')}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-3 mb-3">
                      <span className="text-xs text-gray-500">{getTimeAgo(news.published_at)}</span>
                    </div>

                    <h3 className="font-bold text-lg text-terminal-text mb-2 line-clamp-2">
                      {news.title}
                    </h3>

                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <span className="text-xs text-gray-500 bg-terminal-bg px-2 py-1 rounded">
                          {news.source?.title || news.domain}
                        </span>
                        <span className="text-xs text-terminal-accent">
                          {news.kind === 'news' ? '📰 News' : '📈 Update'}
                        </span>
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
