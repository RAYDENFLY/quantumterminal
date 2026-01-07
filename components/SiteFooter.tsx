import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faExternalLinkAlt } from '@fortawesome/free-solid-svg-icons';

export default function SiteFooter() {
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
        <p className="font-bold text-terminal-accent">Quantum Terminal</p>
      </div>
    </footer>
  );
}
