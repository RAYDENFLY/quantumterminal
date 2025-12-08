'use client';

import useSWR from 'swr';

const fetcher = (url: string) => fetch(url).then((res) => res.json());

interface FearGreedData {
  name: string;
  data: Array<{
    value: string;
    value_classification: string;
    timestamp: string;
  }>;
}

export default function FearGreedIndex() {
  const { data, error, isLoading } = useSWR<FearGreedData>(
    '/api/fear-greed',
    fetcher,
    { refreshInterval: 300000 } // 5 minutes
  );

  if (isLoading) {
    return (
      <div className="terminal-panel animate-pulse">
        <div className="h-48 bg-terminal-bg rounded"></div>
      </div>
    );
  }

  if (error || !data || !data.data || data.data.length === 0) {
    return (
      <div className="terminal-panel">
        <h2 className="terminal-header">😨 Fear & Greed Index</h2>
        <div className="text-terminal-danger text-sm">Failed to load data</div>
      </div>
    );
  }

  const currentValue = parseInt(data.data[0].value);
  const classification = data.data[0].value_classification;

  const getColor = (value: number) => {
    if (value <= 25) return 'text-terminal-danger';
    if (value <= 45) return 'text-orange-400';
    if (value <= 55) return 'text-yellow-400';
    if (value <= 75) return 'text-terminal-success';
    return 'text-green-400';
  };

  const getEmoji = (classification: string) => {
    const map: { [key: string]: string } = {
      'Extreme Fear': '😱',
      'Fear': '😨',
      'Neutral': '😐',
      'Greed': '🤑',
      'Extreme Greed': '🚀'
    };
    return map[classification] || '😐';
  };

  return (
    <div className="terminal-panel">
      <h2 className="terminal-header">😨 Fear & Greed Index</h2>
      
      <div className="flex flex-col items-center py-6">
        {/* Circular Gauge */}
        <div className="relative w-40 h-40">
          <svg className="transform -rotate-90" width="160" height="160">
            {/* Background circle */}
            <circle
              cx="80"
              cy="80"
              r="70"
              fill="none"
              stroke="currentColor"
              strokeWidth="12"
              className="text-terminal-bg"
            />
            {/* Progress circle */}
            <circle
              cx="80"
              cy="80"
              r="70"
              fill="none"
              stroke="currentColor"
              strokeWidth="12"
              strokeDasharray={`${(currentValue / 100) * 440} 440`}
              className={getColor(currentValue)}
              strokeLinecap="round"
            />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <div className="text-4xl mb-1">{getEmoji(classification)}</div>
            <div className={`text-3xl font-bold ${getColor(currentValue)}`}>
              {currentValue}
            </div>
          </div>
        </div>

        {/* Classification */}
        <div className="mt-4 text-center">
          <div className={`text-xl font-bold ${getColor(currentValue)}`}>
            {classification}
          </div>
          <div className="text-xs text-gray-500 mt-2">
            Updated: {new Date(parseInt(data.data[0].timestamp) * 1000).toLocaleString()}
          </div>
        </div>

        {/* Scale */}
        <div className="w-full mt-6">
          <div className="flex justify-between text-xs text-gray-500 mb-2">
            <span>Extreme Fear</span>
            <span>Neutral</span>
            <span>Extreme Greed</span>
          </div>
          <div className="h-2 rounded-full bg-gradient-to-r from-red-500 via-yellow-500 to-green-500"></div>
        </div>
      </div>
    </div>
  );
}
