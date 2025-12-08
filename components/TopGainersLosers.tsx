'use client';

import useSWR from 'swr';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faArrowUp, faArrowDown } from '@fortawesome/free-solid-svg-icons';
import Image from 'next/image';

const fetcher = (url: string) => fetch(url).then((res) => res.json());

interface Coin {
  id: string;
  symbol: string;
  name: string;
  image: string;
  current_price: number;
  price_change_percentage_24h: number;
  market_cap: number;
  total_volume: number;
}

export default function TopGainersLosers() {
  const { data: gainers, isLoading: loadingGainers } = useSWR<Coin[]>(
    '/api/top-gainers',
    fetcher,
    { refreshInterval: 60000 }
  );

  const { data: losers, isLoading: loadingLosers } = useSWR<Coin[]>(
    '/api/top-losers',
    fetcher,
    { refreshInterval: 60000 }
  );

  const formatPrice = (price: number) => {
    if (price >= 1) return `$${price.toFixed(2)}`;
    return `$${price.toFixed(6)}`;
  };

  const formatVolume = (volume: number) => {
    if (volume >= 1e9) return `$${(volume / 1e9).toFixed(2)}B`;
    if (volume >= 1e6) return `$${(volume / 1e6).toFixed(2)}M`;
    return `$${volume.toFixed(0)}`;
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {/* Top Gainers */}
      <div className="terminal-panel">
        <h2 className="terminal-header flex items-center justify-between">
          <span>🚀 Top Gainers 24h</span>
          <span className="text-terminal-success text-xs">+</span>
        </h2>
        
        {loadingGainers ? (
          <div className="space-y-2">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="h-12 bg-terminal-bg rounded animate-pulse"></div>
            ))}
          </div>
        ) : (
          <div className="space-y-2">
            {gainers?.slice(0, 5).map((coin) => (
              <div key={coin.id} className="flex items-center justify-between p-2 hover:bg-terminal-bg rounded transition-colors">
                <div className="flex items-center space-x-3 flex-1">
                  <Image 
                    src={coin.image} 
                    alt={coin.name} 
                    width={24} 
                    height={24}
                    className="rounded-full"
                  />
                  <div>
                    <div className="font-semibold text-sm">{coin.symbol.toUpperCase()}</div>
                    <div className="text-xs text-gray-500">{coin.name}</div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="font-mono text-sm">{formatPrice(coin.current_price)}</div>
                  <div className="text-terminal-success text-xs flex items-center justify-end space-x-1">
                    <FontAwesomeIcon icon={faArrowUp} className="w-3 h-3" />
                    <span>+{coin.price_change_percentage_24h.toFixed(2)}%</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Top Losers */}
      <div className="terminal-panel">
        <h2 className="terminal-header flex items-center justify-between">
          <span>📉 Top Losers 24h</span>
          <span className="text-terminal-danger text-xs">-</span>
        </h2>
        
        {loadingLosers ? (
          <div className="space-y-2">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="h-12 bg-terminal-bg rounded animate-pulse"></div>
            ))}
          </div>
        ) : (
          <div className="space-y-2">
            {losers?.slice(0, 5).map((coin) => (
              <div key={coin.id} className="flex items-center justify-between p-2 hover:bg-terminal-bg rounded transition-colors">
                <div className="flex items-center space-x-3 flex-1">
                  <Image 
                    src={coin.image} 
                    alt={coin.name} 
                    width={24} 
                    height={24}
                    className="rounded-full"
                  />
                  <div>
                    <div className="font-semibold text-sm">{coin.symbol.toUpperCase()}</div>
                    <div className="text-xs text-gray-500">{coin.name}</div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="font-mono text-sm">{formatPrice(coin.current_price)}</div>
                  <div className="text-terminal-danger text-xs flex items-center justify-end space-x-1">
                    <FontAwesomeIcon icon={faArrowDown} className="w-3 h-3" />
                    <span>{coin.price_change_percentage_24h.toFixed(2)}%</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
