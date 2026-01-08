import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faExternalLinkAlt } from '@fortawesome/free-solid-svg-icons';
import Link from 'next/link';

type ModuleHotkey = { label: string; hotkey: string };

const DEFAULT_MODULE_HOTKEYS: ModuleHotkey[] = [
  { label: 'Market Data', hotkey: 'ALT+1' },
  { label: 'News', hotkey: 'ALT+2' },
  { label: 'On-Chain', hotkey: 'ALT+3' },
  { label: 'Research', hotkey: 'ALT+4' },
  { label: 'Learning', hotkey: 'ALT+5' },
  { label: 'Submissions', hotkey: 'ALT+6' },
];

export default function SiteFooter({
  showModuleHotkeys = false,
  moduleHotkeys = DEFAULT_MODULE_HOTKEYS,
}: {
  showModuleHotkeys?: boolean;
  moduleHotkeys?: ModuleHotkey[];
}) {
  return (
    <footer className="border-t border-terminal-border p-4 text-center text-xs text-gray-500">
      <p>⚠️ DISCLAIMER: For informational and educational purposes only. Not financial advice.</p>
      <p className="mt-1">
        Data provided by CoinGecko, CoinDesk, Alternative.me, Mempool.space, Blockchain.com, and DeFi Llama
      </p>
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
        <Link href="/terms" className="text-gray-400 hover:text-terminal-accent transition-colors">
          Terms
        </Link>
        <span className="text-gray-600">•</span>
        <Link href="/privacy" className="text-gray-400 hover:text-terminal-accent transition-colors">
          Privacy
        </Link>
        <span className="text-gray-600">•</span>
        <p className="font-bold text-terminal-accent">Quantum Terminal</p>
      </div>

      {showModuleHotkeys ? (
        <div className="mt-3 mx-auto max-w-3xl">
          <div className="grid grid-cols-2 gap-x-6 gap-y-1 sm:grid-cols-3 md:grid-cols-6 text-[11px] text-gray-400">
            {moduleHotkeys.map((item) => (
              <div key={item.hotkey} className="flex items-center justify-center gap-2">
                <span className="text-gray-400">{item.label}</span>
                <span className="text-terminal-accent/80">{item.hotkey}</span>
              </div>
            ))}
          </div>
        </div>
      ) : null}
    </footer>
  );
}
