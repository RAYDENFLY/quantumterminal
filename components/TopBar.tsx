'use client';

import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
  faChartLine, 
  faNewspaper, 
  faCubes, 
  faBook,
  faGraduationCap,
  faBell 
} from '@fortawesome/free-solid-svg-icons';

interface TopBarProps {
  activeModule: string;
  setActiveModule: (module: string) => void;
}

export default function TopBar({ activeModule, setActiveModule }: TopBarProps) {
  const modules = [
    { id: 'market', label: 'Market Data', icon: faChartLine, hotkey: 'ALT+1' },
    { id: 'news', label: 'News', icon: faNewspaper, hotkey: 'ALT+2' },
    { id: 'onchain', label: 'On-Chain', icon: faCubes, hotkey: 'ALT+3' },
    { id: 'research', label: 'Research', icon: faBook, hotkey: 'ALT+4' },
    { id: 'learning', label: 'Learning', icon: faGraduationCap, hotkey: 'ALT+5' },
  ];

  return (
    <header className="bg-terminal-panel border-b border-terminal-border">
      <div className="px-4 py-3">
        <div className="flex items-center justify-between">
          {/* Logo */}
          <div className="flex items-center space-x-2">
            <div className="text-2xl font-bold">
              <span className="text-terminal-accent glow-accent">QUANTUM</span>
              <span className="text-terminal-text ml-1">TERMINAL</span>
            </div>
            <div className="text-xs text-gray-500 mt-1">v1.0.0</div>
          </div>

          {/* Module Navigation */}
          <nav className="flex space-x-1">
            {modules.map((module) => (
              <button
                key={module.id}
                onClick={() => setActiveModule(module.id)}
                className={`px-4 py-2 rounded-md text-sm font-medium transition-all duration-200 flex items-center space-x-2 ${
                  activeModule === module.id
                    ? 'bg-terminal-accent text-terminal-bg'
                    : 'text-gray-400 hover:text-terminal-text hover:bg-terminal-bg'
                }`}
                title={module.hotkey}
              >
                <FontAwesomeIcon icon={module.icon} className="w-4 h-4" />
                <span>{module.label}</span>
                <span className="text-xs opacity-60">{module.hotkey}</span>
              </button>
            ))}
          </nav>

          {/* Alerts */}
          <button className="p-2 rounded-md text-gray-400 hover:text-terminal-accent transition-colors relative">
            <FontAwesomeIcon icon={faBell} className="w-5 h-5" />
            <span className="absolute top-1 right-1 w-2 h-2 bg-terminal-danger rounded-full"></span>
          </button>
        </div>
      </div>

      {/* Breaking News Ticker */}
      <div className="bg-terminal-bg border-t border-terminal-border px-4 py-2 overflow-hidden">
        <div className="flex items-center space-x-4">
          <span className="text-terminal-danger font-bold text-xs uppercase">Breaking</span>
          <div className="flex-1 overflow-hidden">
            <div className="animate-marquee whitespace-nowrap text-sm text-gray-400">
              Bitcoin reaches new all-time high • Ethereum upgrade scheduled for Q1 2026 • SEC approves new crypto ETFs • Major DeFi protocol launches on Layer 2
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
