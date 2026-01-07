'use client';

import { useState } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
  faChartLine, 
  faNewspaper, 
  faCubes, 
  faBook,
  faGraduationCap,
  faBell,
  faSignal,
  faBars,
  faTimes,
  faList,
  faCodeBranch,
  faHandHoldingDollar
} from '@fortawesome/free-solid-svg-icons';
import useSWR from 'swr';
import packageJson from '../package.json';
import ChangelogModal from './ChangelogModal';
import Link from 'next/link';

const fetcher = (url: string) => fetch(url).then((res) => res.json());

interface TopBarProps {
  activeModule: string;
  setActiveModule: (module: string) => void;
}

export default function TopBar({ activeModule, setActiveModule }: TopBarProps) {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isChangelogOpen, setIsChangelogOpen] = useState(false);

  const { data: meData, mutate: mutateMe } = useSWR('/api/auth/me', fetcher);

  const user = meData?.success ? meData.user : null;

  async function onLogout() {
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
    } finally {
      mutateMe();
    }
  }

  // Fetch real news data
  const { data: newsData } = useSWR('/api/news', fetcher, { refreshInterval: 300000 }); // 5 minutes

  // Fetch Gate.io currency data
  const { data: coinData } = useSWR('/api/coin-prices', fetcher, { refreshInterval: 60000 }); // 1 minute

  const modules = [
    { id: 'market', label: 'Market Data', icon: faChartLine, hotkey: 'ALT+1' },
    { id: 'news', label: 'News', icon: faNewspaper, hotkey: 'ALT+2' },
    { id: 'onchain', label: 'On-Chain', icon: faCubes, hotkey: 'ALT+3' },
    { id: 'research', label: 'Research', icon: faBook, hotkey: 'ALT+4' },
    { id: 'learning', label: 'Learning', icon: faGraduationCap, hotkey: 'ALT+5' },
    { id: 'submissions', label: 'Submissions', icon: faList, hotkey: 'ALT+6' },
  ];

  return (
    <header className="bg-terminal-panel border-b border-terminal-border">
      <div className="px-4 py-3">
        <div className="flex items-center justify-between">
          {/* Logo */}
          <div className="flex items-center space-x-2">
            <div className="text-xl md:text-2xl font-bold">
              <span className="text-terminal-accent glow-accent">QUANTUM</span>
              <span className="text-terminal-text ml-1">TERMINAL</span>
            </div>
            <div className="text-xs text-gray-500 mt-1 hidden sm:block">v{packageJson.version}</div>
          </div>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex space-x-1">
            {modules.map((module) => (
              <button
                key={module.id}
                onClick={() => setActiveModule(module.id)}
                className={`px-3 lg:px-4 py-2 rounded-md text-sm font-medium transition-all duration-200 flex items-center space-x-2 ${
                  activeModule === module.id
                    ? 'bg-terminal-accent text-terminal-bg'
                    : 'text-gray-400 hover:text-terminal-text hover:bg-terminal-bg'
                }`}
                title={module.hotkey}
              >
                <FontAwesomeIcon icon={module.icon} className="w-4 h-4" />
                <span className="hidden lg:inline">{module.label}</span>
                <span className="text-xs opacity-60 hidden xl:inline">{module.hotkey}</span>
              </button>
            ))}
          </nav>

          {/* Mobile Menu Button & Alerts */}
          <div className="flex items-center space-x-2">
            {/* Auth (desktop) */}
            {user ? (
              <div className="hidden md:flex items-center gap-2">
                <span className="text-xs text-gray-400 max-w-[180px] truncate" title={user.email}>
                  {user.email}
                </span>
                <button
                  onClick={onLogout}
                  className="rounded-md border border-terminal-border px-3 py-2 text-xs text-gray-200 hover:text-terminal-accent hover:border-terminal-accent transition-colors"
                >
                  Logout
                </button>
              </div>
            ) : (
              <div className="hidden md:flex items-center gap-2">
                <Link
                  href="/login"
                  className="rounded-md border border-terminal-border px-3 py-2 text-xs text-gray-200 hover:text-terminal-accent hover:border-terminal-accent transition-colors"
                >
                  Login
                </Link>
                <Link
                  href="/register"
                  className="rounded-md bg-terminal-accent px-3 py-2 text-xs font-semibold text-terminal-bg"
                >
                  Register
                </Link>
              </div>
            )}

            <Link
              href="/donasi"
              className="hidden md:inline-flex items-center space-x-2 p-2 rounded-md text-gray-400 hover:text-terminal-accent transition-colors"
              title="Donasi"
            >
              <FontAwesomeIcon icon={faHandHoldingDollar} className="w-5 h-5" />
              <span className="hidden lg:inline text-sm">Donasi</span>
            </Link>

            <button
              onClick={() => setIsChangelogOpen(true)}
              className="hidden md:inline-flex items-center space-x-2 p-2 rounded-md text-gray-400 hover:text-terminal-accent transition-colors"
              title="Changelog"
            >
              <FontAwesomeIcon icon={faCodeBranch} className="w-5 h-5" />
            </button>

            <button className="p-2 rounded-md text-gray-400 hover:text-terminal-accent transition-colors relative hidden md:block">
              <FontAwesomeIcon icon={faBell} className="w-5 h-5" />
              <span className="absolute top-1 right-1 w-2 h-2 bg-terminal-danger rounded-full"></span>
            </button>

            {/* Mobile Menu Toggle */}
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="md:hidden p-2 rounded-md text-gray-400 hover:text-terminal-accent transition-colors"
            >
              <FontAwesomeIcon icon={isMobileMenuOpen ? faTimes : faBars} className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Mobile Navigation Menu */}
        {isMobileMenuOpen && (
          <div className="md:hidden mt-4 pb-4 border-t border-terminal-border pt-4">
            <nav className="flex flex-col space-y-2">
              {modules.map((module) => (
                <button
                  key={module.id}
                  onClick={() => {
                    setActiveModule(module.id);
                    setIsMobileMenuOpen(false);
                  }}
                  className={`px-4 py-3 rounded-md text-sm font-medium transition-all duration-200 flex items-center space-x-3 ${
                    activeModule === module.id
                      ? 'bg-terminal-accent text-terminal-bg'
                      : 'text-gray-400 hover:text-terminal-text hover:bg-terminal-bg'
                  }`}
                >
                  <FontAwesomeIcon icon={module.icon} className="w-4 h-4" />
                  <span>{module.label}</span>
                  <span className="text-xs opacity-60 ml-auto">{module.hotkey}</span>
                </button>
              ))}
            </nav>
            <div className="mt-4 pt-4 border-t border-terminal-border">
              {/* Auth (mobile) */}
              {user ? (
                <div className="mb-2">
                  <div className="px-3 py-2 text-xs text-gray-400 truncate" title={user.email}>
                    {user.email}
                  </div>
                  <button
                    onClick={() => {
                      onLogout();
                      setIsMobileMenuOpen(false);
                    }}
                    className="w-full p-3 rounded-md text-gray-400 hover:text-terminal-accent transition-colors flex items-center space-x-3"
                  >
                    <span>Logout</span>
                  </button>
                </div>
              ) : (
                <div className="mb-2">
                  <Link
                    href="/login"
                    onClick={() => setIsMobileMenuOpen(false)}
                    className="w-full p-3 rounded-md text-gray-400 hover:text-terminal-accent transition-colors flex items-center space-x-3"
                  >
                    <span>Login</span>
                  </Link>
                  <Link
                    href="/register"
                    onClick={() => setIsMobileMenuOpen(false)}
                    className="w-full p-3 rounded-md text-terminal-bg bg-terminal-accent transition-colors flex items-center justify-center"
                  >
                    <span className="text-sm font-semibold">Register</span>
                  </Link>
                </div>
              )}

              <Link
                href="/donasi"
                onClick={() => setIsMobileMenuOpen(false)}
                className="w-full p-3 rounded-md text-gray-400 hover:text-terminal-accent transition-colors flex items-center space-x-3"
              >
                <FontAwesomeIcon icon={faHandHoldingDollar} className="w-4 h-4" />
                <span>Donasi</span>
              </Link>

              <button
                onClick={() => {
                  setIsChangelogOpen(true);
                  setIsMobileMenuOpen(false);
                }}
                className="w-full p-3 rounded-md text-gray-400 hover:text-terminal-accent transition-colors flex items-center space-x-3"
              >
                <FontAwesomeIcon icon={faCodeBranch} className="w-4 h-4" />
                <span>Changelog</span>
              </button>
              <button className="w-full p-3 rounded-md text-gray-400 hover:text-terminal-accent transition-colors flex items-center space-x-3">
                <FontAwesomeIcon icon={faBell} className="w-4 h-4" />
                <span>Notifications</span>
                <span className="ml-auto w-2 h-2 bg-terminal-danger rounded-full"></span>
              </button>
            </div>
          </div>
        )}
      </div>

      <ChangelogModal open={isChangelogOpen} onClose={() => setIsChangelogOpen(false)} />

      {/* Breaking News Ticker */}
      <div className="bg-terminal-bg border-t border-terminal-border px-4 py-2 overflow-hidden">
        <div className="flex items-center space-x-2 md:space-x-4">
          <span className="text-terminal-danger font-bold text-xs uppercase flex-shrink-0">Breaking</span>
          <div className="relative overflow-hidden flex-1">
            <div className="flex animate-marquee md:animate-marquee whitespace-nowrap text-sm text-gray-400">
              {newsData?.results?.slice(0, 5).map((article: any, index: number) => (
                <span key={index} className="mr-8 md:mr-12 inline-block">
                  {article.title}
                </span>
              ))}
              {newsData?.results?.slice(0, 5).map((article: any, index: number) => (
                <span key={`repeat-${index}`} className="mr-8 md:mr-12 inline-block">
                  {article.title}
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Coin Prices Ticker */}
      <div className="bg-terminal-bg border-t border-terminal-border px-4 py-2 overflow-hidden">
        <div className="flex items-center space-x-2 md:space-x-4">
          <FontAwesomeIcon icon={faSignal} className="w-4 h-4 text-terminal-accent flex-shrink-0" />
          <div className="flex-1 overflow-hidden">
            <div className="animate-marquee md:animate-marquee whitespace-nowrap text-sm text-gray-400 flex items-center">
              {coinData?.success ? (
                <>
                  {coinData.data.map((coin: any, index: number) => (
                    <div key={index} className="flex items-center space-x-1 md:space-x-2 mr-4 md:mr-8 inline-flex">
                      <img
                        src={coin.image}
                        alt={coin.symbol}
                        className="w-3 h-3 md:w-4 md:h-4 rounded-full"
                      />
                      <span className="px-1 text-xs md:text-sm">
                        {coin.symbol.toUpperCase()}: ${(coin.current_price || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} 
                        <span className={`ml-1 ${coin.price_change_percentage_24h >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                          ({coin.price_change_percentage_24h >= 0 ? '+' : ''}{(coin.price_change_percentage_24h || 0).toFixed(2)}%)
                        </span>
                      </span>
                    </div>
                  ))}
                  {coinData.data.map((coin: any, index: number) => (
                    <div key={`repeat-${index}`} className="flex items-center space-x-1 md:space-x-2 mr-4 md:mr-8 inline-flex">
                      <img
                        src={coin.image}
                        alt={coin.symbol}
                        className="w-3 h-3 md:w-4 md:h-4 rounded-full"
                      />
                      <span className="px-1 text-xs md:text-sm">
                        {coin.symbol.toUpperCase()}: ${(coin.current_price || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} 
                        <span className={`ml-1 ${coin.price_change_percentage_24h >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                          ({coin.price_change_percentage_24h >= 0 ? '+' : ''}{(coin.price_change_percentage_24h || 0).toFixed(2)}%)
                        </span>
                      </span>
                    </div>
                  ))}
                </>
              ) : (
                <span className="text-xs md:text-sm">Loading coin prices...</span>
              )}
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
