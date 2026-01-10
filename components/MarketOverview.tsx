'use client';

import { useEffect, useState } from 'react';
import useSWR from 'swr';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faArrowUp, faArrowDown } from '@fortawesome/free-solid-svg-icons';
import AIChartAnalysis from './AIChartAnalysis';

const fetcher = (url: string) => fetch(url).then((res) => res.json());

interface GlobalData {
  data: {
    total_market_cap: { usd: number };
    total_volume: { usd: number };
    market_cap_percentage: { btc: number; eth: number };
    market_cap_change_percentage_24h_usd: number;
  };
}

export default function MarketOverview() {
  const { data, error, isLoading } = useSWR<GlobalData>(
    '/api/global-market',
    fetcher,
    { refreshInterval: 60000 }
  );

  // Fetch exchange inflow data
  const { data: inflowData } = useSWR(
    '/api/exchange-inflow',
    fetcher,
    { refreshInterval: 300000 } // 5 minutes
  );

  const formatNumber = (num: number): string => {
    if (num >= 1e12) return `$${(num / 1e12).toFixed(2)}T`;
    if (num >= 1e9) return `$${(num / 1e9).toFixed(2)}B`;
    if (num >= 1e6) return `$${(num / 1e6).toFixed(2)}M`;
    return `$${num.toFixed(2)}`;
  };

  if (isLoading) {
    return (
      <div className="terminal-panel animate-pulse">
        <div className="h-32 bg-terminal-bg rounded"></div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="terminal-panel">
        <div className="text-terminal-danger">Failed to load market data</div>
      </div>
    );
  }

  const marketData = data.data;
  const isPositive = marketData.market_cap_change_percentage_24h_usd >= 0;

  return (
    <div className="terminal-panel py-6">
      <h2 className="terminal-header mb-6">📊 Global Market Overview</h2>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-6">
        {/* Total Market Cap */}
        <div className="py-3">
          <div className="text-xs text-gray-500 mb-2">Total Market Cap</div>
          <div className="text-lg lg:text-2xl font-bold text-terminal-accent">
            {formatNumber(marketData.total_market_cap.usd)}
          </div>
          <div className={`text-sm flex items-center space-x-1 mt-2 ${isPositive ? 'price-up' : 'price-down'}`}>
            <FontAwesomeIcon icon={isPositive ? faArrowUp : faArrowDown} className="w-3 h-3" />
            <span>{Math.abs(marketData.market_cap_change_percentage_24h_usd).toFixed(2)}%</span>
          </div>
        </div>

        {/* 24h Volume */}
        <div className="py-3">
          <div className="text-xs text-gray-500 mb-2">24h Volume</div>
          <div className="text-lg lg:text-2xl font-bold">
            {formatNumber(marketData.total_volume.usd)}
          </div>
          <div className="text-sm text-gray-500 mt-2">Trading Activity</div>
        </div>

        {/* BTC Dominance */}
        <div className="py-3">
          <div className="text-xs text-gray-500 mb-2">BTC Dominance</div>
          <div className="text-lg lg:text-2xl font-bold text-orange-400">
            {marketData.market_cap_percentage.btc.toFixed(2)}%
          </div>
          <div className="w-full bg-terminal-bg rounded-full h-2 mt-3">
            <div
              className="bg-orange-400 h-2 rounded-full transition-all duration-500"
              style={{ width: `${marketData.market_cap_percentage.btc}%` }}
            ></div>
          </div>
        </div>

        {/* ETH Dominance */}
        <div className="py-3">
          <div className="text-xs text-gray-500 mb-2">ETH Dominance</div>
          <div className="text-lg lg:text-2xl font-bold text-blue-400">
            {marketData.market_cap_percentage.eth.toFixed(2)}%
          </div>
          <div className="w-full bg-terminal-bg rounded-full h-2 mt-3">
            <div
              className="bg-blue-400 h-2 rounded-full transition-all duration-500"
              style={{ width: `${marketData.market_cap_percentage.eth}%` }}
            ></div>
          </div>
        </div>

        {/* Total Coin Inflow */}
        <div className="py-3">
          <div className="text-xs text-gray-500 mb-2">Exchange Inflow</div>
          <div className="text-lg lg:text-2xl font-bold text-green-400">
            {inflowData ? formatNumber(inflowData.totalInflow || 0) : 'Loading...'}
          </div>
          <div className="text-sm text-gray-500 mt-2">24h Total</div>
        </div>
      </div>


      <div className="mt-6">
        <AIChartAnalysis />
      </div>
    </div>
  );
}
