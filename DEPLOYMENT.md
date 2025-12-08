# 🚀 Quantum Terminal - Crypto Data & Research Platform

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/yourusername/quantumterm)

Real-time cryptocurrency market data, blockchain analytics, research papers, and market indicators in Bloomberg Terminal style.

![Quantum Terminal](https://img.shields.io/badge/Next.js-14-black) ![TypeScript](https://img.shields.io/badge/TypeScript-5-blue) ![Tailwind CSS](https://img.shields.io/badge/Tailwind-3-38bdf8) ![License](https://img.shields.io/badge/License-MIT-green)

## ✨ Features

### 📊 Current Features (MVP)
- **Global Market Overview** - Real-time total market cap, 24h volume, BTC/ETH dominance
- **Top Gainers & Losers** - Track top performing cryptocurrencies in 24h with live updates
- **Fear & Greed Index** - CMC Crypto Fear & Greed Index with beautiful circular gauge
- **Live News Feed** - Real-time crypto news from multiple sources with sentiment indicators
- **Keyboard Shortcuts** - Quick navigation using hotkeys (ALT+1, ALT+2, etc.)
- **Bloomberg Terminal Style** - Dark theme with professional terminal aesthetics

### 🔮 Coming Soon
- On-chain data module (whale tracking, gas fees, active addresses)
- Research paper aggregator from ArXiv and SSRN
- Learning resources center with tutorials
- Signal trading module (educational only)
- Market indicators panel (altcoin season index, rainbow chart)
- Crypto market heatmap by sector

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ 
- npm or yarn

### Installation

```bash
# Clone the repository
git clone https://github.com/yourusername/quantumterm.git
cd quantumterm

# Install dependencies
npm install

# Run development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## 📦 Deploy to Vercel

### One-Click Deploy

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/yourusername/quantumterm)

### Manual Deploy

1. Install Vercel CLI:
```bash
npm install -g vercel
```

2. Deploy:
```bash
vercel
```

3. Follow the prompts to link your project

### Configuration

The project is pre-configured for Vercel with `vercel.json`. No additional configuration needed!

**Environment Variables (Optional):**
- `NEXT_PUBLIC_CMC_API_KEY` - CoinMarketCap API key (for enhanced features)
- `NEXT_PUBLIC_GLASSNODE_API_KEY` - Glassnode API key (for on-chain data)
- `NEXT_PUBLIC_MESSARI_API_KEY` - Messari API key (for research)

## 🛠️ Tech Stack

- **Framework:** Next.js 14 (App Router)
- **Language:** TypeScript
- **Styling:** Tailwind CSS
- **Data Fetching:** SWR (with automatic revalidation)
- **Icons:** Font Awesome
- **Charts:** Recharts (coming soon)
- **Deployment:** Vercel

## 📁 Project Structure

```
quantumterm/
├── app/
│   ├── api/                 # API routes
│   │   ├── global-market/   # Global market data
│   │   ├── top-gainers/     # Top gainers
│   │   ├── top-losers/      # Top losers
│   │   ├── fear-greed/      # Fear & Greed Index
│   │   └── news/            # News feed
│   ├── layout.tsx           # Root layout
│   ├── page.tsx             # Home page
│   └── globals.css          # Global styles
├── components/
│   ├── TopBar.tsx           # Header with navigation
│   ├── MarketOverview.tsx   # Market overview panel
│   ├── TopGainersLosers.tsx # Gainers/Losers lists
│   ├── FearGreedIndex.tsx   # Fear & Greed gauge
│   └── NewsFeed.tsx         # News feed panel
├── hooks/
│   └── useHotkeys.ts        # Keyboard shortcuts hook
├── tailwind.config.ts       # Tailwind configuration
├── next.config.mjs          # Next.js configuration
└── vercel.json              # Vercel deployment config
```

## ⌨️ Keyboard Shortcuts

| Shortcut | Action |
|----------|--------|
| `ALT + 1` | Market Data |
| `ALT + 2` | News Feed |
| `ALT + 3` | On-Chain Data (coming soon) |
| `ALT + 4` | Research Papers (coming soon) |
| `ALT + 5` | Learning Resources (coming soon) |

## 🔌 API Integrations

### Current APIs
- **CoinGecko** - Free tier for market data, prices, and coin information
- **Alternative.me** - Fear & Greed Index
- **CryptoPanic** - Crypto news aggregation

### Future APIs
- **Glassnode** - On-chain analytics
- **Messari** - Research and metrics
- **CoinMarketCap** - Enhanced market data

## 📊 Data Update Intervals

- **Global Market Data:** Every 60 seconds
- **Top Gainers/Losers:** Every 60 seconds
- **Fear & Greed Index:** Every 5 minutes
- **News Feed:** Every 2 minutes

## 🎨 Customization

### Theme Colors

Edit `tailwind.config.ts` to customize colors:

```typescript
terminal: {
  bg: '#0a0e27',        // Background
  panel: '#0f172a',     // Panel background
  border: '#1e293b',    // Borders
  text: '#e2e8f0',      // Text
  accent: '#38bdf8',    // Accent color
  success: '#10b981',   // Positive values
  danger: '#ef4444',    // Negative values
  warning: '#f59e0b',   // Warnings
}
```

## 🤝 Contributing

Contributions are welcome! Please follow these steps:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📝 Roadmap

### Phase 1 - MVP ✅ (Completed)
- [x] Bloomberg terminal-style UI
- [x] Global market overview
- [x] Top gainers/losers
- [x] Fear & Greed Index
- [x] News aggregator
- [x] Keyboard shortcuts

### Phase 2 - On-Chain Analytics (In Progress)
- [ ] Blockchain metrics (TPS, gas fees, active addresses)
- [ ] On-chain indicators (NVT, MVRV, SOPR)
- [ ] Whale tracker
- [ ] Exchange flow monitoring

### Phase 3 - Research & Education
- [ ] Research paper database
- [ ] Learning resources center
- [ ] Interactive tutorials
- [ ] Crypto glossary

### Phase 4 - Advanced Features
- [ ] Signal module (educational)
- [ ] Market cycle indicators
- [ ] Custom alerts system
- [ ] Portfolio tracker (view-only)

## ⚠️ Disclaimer

**This platform is for informational and educational purposes only.**

- Not financial advice
- Not for trading recommendations
- Always do your own research (DYOR)
- Cryptocurrency investments carry risk

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- Data provided by [CoinGecko](https://www.coingecko.com/)
- Fear & Greed Index by [Alternative.me](https://alternative.me/)
- News aggregation by [CryptoPanic](https://cryptopanic.com/)
- Inspired by Bloomberg Terminal design
- Built with ❤️ using Next.js and Tailwind CSS

## 📧 Contact

For questions, suggestions, or issues, please open an issue on GitHub.

---

**Built with Next.js 14 & TypeScript | Optimized for Vercel Deployment**
