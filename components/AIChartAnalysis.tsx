'use client';

import { useState } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faRobot, faSpinner, faClock, faSearch } from '@fortawesome/free-solid-svg-icons';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

interface AIChartAnalysisProps {
    coinId?: string; // Optional default
}

type TimeFrame = '15m' | '1H' | '4H' | '1D';

export default function AIChartAnalysis({ coinId = 'bitcoin' }: AIChartAnalysisProps) {
    const [analysis, setAnalysis] = useState<string>('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [timeFrame, setTimeFrame] = useState<TimeFrame>('1H');
    const [ticker, setTicker] = useState('BTC');

    const handleAnalyze = async () => {
        if (!ticker.trim()) return;

        setLoading(true);
        setError('');
        setAnalysis('');

        try {
            const res = await fetch('/api/analyze-chart', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ ticker, timeFrame }),
            });

            const data = await res.json();

            if (!res.ok || !data.success) {
                throw new Error(data.error || 'Failed to analyze data');
            }

            setAnalysis(data.analysis);
        } catch (err: any) {
            setError(err.message || 'Something went wrong');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="terminal-panel border-terminal-accent/30">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-4">
                <h3 className="terminal-header text-lg flex items-center space-x-2">
                    <FontAwesomeIcon icon={faRobot} className="text-terminal-accent" />
                    <span>QUANTUM AI ANALYSIS</span>
                </h3>

                <div className="flex flex-wrap items-center gap-2">
                    {/* Ticker Input */}
                    <div className="flex items-center bg-terminal-bg rounded-md p-1 border border-terminal-border">
                        <FontAwesomeIcon icon={faSearch} className="text-gray-500 text-xs ml-2 mr-1" />
                        <input
                            type="text"
                            value={ticker}
                            onChange={(e) => setTicker(e.target.value.toUpperCase())}
                            className="bg-transparent text-xs text-terminal-text w-16 focus:outline-none uppercase font-bold"
                            placeholder="BTC"
                        />
                    </div>

                    {/* Timeframe Selector */}
                    <div className="flex items-center space-x-1 bg-terminal-bg rounded-md p-1 border border-terminal-border">
                        <FontAwesomeIcon icon={faClock} className="text-gray-500 text-xs ml-2 mr-1" />
                        {(['15m', '1H', '4H', '1D'] as TimeFrame[]).map((tf) => (
                            <button
                                key={tf}
                                onClick={() => setTimeFrame(tf)}
                                className={`px-2 py-1 text-xs rounded transition-all ${timeFrame === tf
                                    ? 'bg-terminal-accent text-terminal-bg font-bold'
                                    : 'text-gray-400 hover:text-white hover:bg-white/5'
                                    }`}
                            >
                                {tf}
                            </button>
                        ))}
                    </div>

                    <button
                        onClick={handleAnalyze}
                        disabled={loading}
                        className="bg-terminal-accent text-terminal-bg px-4 py-1.5 rounded text-sm font-bold hover:bg-terminal-accent/90 disabled:opacity-50 transition-colors flex items-center space-x-2 min-w-[120px] justify-center"
                    >
                        {loading ? (
                            <>
                                <FontAwesomeIcon icon={faSpinner} className="animate-spin" />
                                <span>Scanning...</span>
                            </>
                        ) : (
                            <>
                                <FontAwesomeIcon icon={faRobot} />
                                <span>Analyze</span>
                            </>
                        )}
                    </button>
                </div>
            </div>

            {error && (
                <div className="p-3 bg-red-500/10 border border-red-500/20 text-red-500 rounded text-sm mb-4">
                    {error}
                </div>
            )}

            {analysis && (
                <div className="bg-terminal-bg p-4 rounded border border-terminal-border text-gray-300 text-sm leading-relaxed overflow-x-auto animate-in fade-in slide-in-from-bottom-2 duration-500">
                    <div className="prose prose-invert prose-sm max-w-none whitespace-pre-wrap">
                        {/* Markdown with GFM */}
                        <ReactMarkdown remarkPlugins={[remarkGfm]}>{analysis}</ReactMarkdown>
                    </div>
                </div>
            )}

            {!analysis && !loading && !error && (
                <div className="text-xs text-gray-500 text-center py-6 border-2 border-dashed border-gray-800 rounded">
                    <div className="mb-2 text-2xl opacity-20">⚡</div>
                    Masukkan Ticker (misal: BTC, ETH, SOL) dan pilih Time Frame untuk analisa AI.
                </div>
            )}
        </div>
    );
}
