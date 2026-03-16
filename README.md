# Quantum Terminal

A professional cryptocurrency trading dashboard inspired by Bloomberg Terminal, built with Next.js, React, and TypeScript. Features real-time market data, news aggregation, on-chain analytics, and educational resources.

![Quantum Terminal Preview](https://github.com/RAYDENFLY/quantumterminal/blob/main/public/image.png)

## ✨ Features

### 🏠 Main Dashboard
- **Real-time Market Overview**: Global crypto market data with 24h changes
- **Top Gainers/Losers**: Live price movements and volume data
- **Trading Signals**: Educational signals with risk management (for informational purposes only)
- **Market Updates**: Social media style posts with market analysis

### 📰 News & Information
- **Breaking News Ticker**: Real-time headlines from CoinDesk RSS feed
- **Coin Prices Ticker**: Live price updates with icons and percentage changes
- **News Feed**: Clickable news articles with pagination (7 items per page)
- **Fear & Greed Index**: Market sentiment indicator with historical data

### 📊 On-Chain Analytics
- **Bitcoin Analytics**: Network statistics, fees, and market data
- **Ethereum Data**: Gas prices, staking information, and network metrics
- **TVL Data**: Total Value Locked across DeFi protocols
- **Whale Tracking**: Large wallet movements and alerts

### 📚 Research & Learning
- **Research Papers**: Curated collection of crypto research papers
- **Learning Center**: Educational resources for all skill levels
- **Market Analysis**: Altcoin season indicators and Bitcoin dominance charts

### 🎨 UI/UX Features
- **Terminal Theme**: Dark professional interface inspired by Bloomberg Terminal
- **Responsive Design**: Optimized for desktop and mobile devices
- **Keyboard Navigation**: Hotkeys for quick module switching (Alt+1, Alt+2, etc.)
- **Smooth Animations**: Marquee effects for tickers and transitions

### 🔥 Orderbook Heatmap (Live)
- **Interactive orderbook heatmap** for visualizing liquidity, bid/ask walls, and depth intensity
- **Cumulative Depth Chart** + **Volume Distribution** visualization
- **Support/Resistance Zones** detection
- **Orderbook Velocity** + microstructure summaries (spread/imbalance/short-term bias)
- **Spoofing-style alerts** (heuristics) and **data feed disconnected** warning with retry
- **Binance-only symbol list**: symbol metadata (BASE/QUOTE) is loaded directly from Binance exchangeInfo

### 🧱 Layer1 (L1) Terminal
- **Multi-panel** L1-style view (4 or 6 panels)
- **Orderbook snapshots** (depth ladder preview, mid + spread)
- **Microstructure** metrics (CVD/delta, flow speed, volatility/spread meters, imbalance)
- **Whale wall** detection + recent wall logs
- **Layout persistence** via `localStorage` (`qt_layer1_layout_v1`)

## 🚀 Quick Start

### Prerequisites
- Node.js 18+
- npm or yarn

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/RAYDENFLY/quantumterminal.git
   cd quantumterminal
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Environment Setup**
   ```bash
   cp .env.example .env.local
   ```

   The application works without API keys but will show limited data. For full functionality, add these optional API keys to `.env.local`:

   ```env
   # Optional: CoinGecko API for enhanced market data
   COINGECKO_API_KEY=your_coingecko_key

   # Optional: Additional data sources
   COVALENT_API_KEY=your_covalent_key
   DEBANK_API_KEY=your_debank_key
   ```

   **User Authentication (community accounts)**

   If you enable the new auth endpoints (`/api/auth/register`, `/api/auth/login`, `/api/auth/logout`), set this required secret:

   ```env
   # Required: used to issue HTTP-only session cookies
   SESSION_SECRET=replace-with-a-long-random-string
   ```

   **Password reset email (Brevo SMTP)**

   Untuk fitur **Lupa password**, kamu bisa pakai Brevo SMTP (gratis) supaya link reset dikirim via email.
   Kalau variabel di bawah belum di-set, app akan **log** reset link ke server console.

   ```env
   # Needed so reset links become absolute URLs in production
   NEXT_PUBLIC_SITE_URL=https://your-domain.com

   # SMTP sender
   MAIL_FROM="Quantum Terminal <no-reply@your-domain.com>"

   # Brevo SMTP
   SMTP_HOST=smtp-relay.brevo.com
   SMTP_PORT=587
   SMTP_USER=your-brevo-smtp-login
   SMTP_PASS=your-brevo-smtp-key
   ```

4. **Run the development server**
   ```bash
   npm run dev
   ```

5. **Open your browser**
   ```
   http://localhost:3000
   ```

### Build for Production

```bash
npm run build
npm start
```

## 🛠️ Tech Stack

- **Framework**: Next.js 16 with Turbopack
- **Language**: TypeScript
- **Styling**: Tailwind CSS with custom terminal theme
- **State Management**: React hooks with SWR for data fetching
- **Icons**: Font Awesome
- **Data Sources**:
  - CoinGecko API (market data)
  - CoinDesk RSS (news feed)
  - Alternative.me (Fear & Greed Index)
  - Mempool.space (Bitcoin fees)
  - Blockchain.com (Bitcoin stats)
  - DeFi Llama (TVL data)
   - Binance (orderbook heatmap + symbol metadata)

## 🧭 Modules

### Heatmap Terminal
Open: `/heatmap`

The heatmap uses a **futures-first** approach where possible:
- REST snapshots prefer Binance Futures and fall back to Spot.
- WebSocket depth stream also prefers Futures and falls back to Spot.

Symbol search/autocomplete is powered by a cached API route:
- `GET /api/binance-symbols` (futures exchangeInfo, fallback to spot; cached ~1 hour)

### Layer1 (L1) Terminal
Open: `/layer1`

`components/layer1/Layer1Terminal.tsx` is a multi-panel **Level-1 style** terminal focused on quick microstructure reads across several symbols at once.

Key capabilities:
- **Multi-panel layout** (4 or 6 panels) with per-panel symbol + depth settings
- **Orderbook snapshot panels** (best bid/ask ladder preview, mid + spread)
- **Microstructure metrics** (CVD/delta, flow speed, volatility/spread meters, imbalance)
- **Whale wall detection** + recent whale wall logs
- Layout persisted in `localStorage` (`qt_layer1_layout_v1`)

Backend endpoints used by L1:
- `GET /api/layer1/symbols`
- `GET /api/layer1/orderbook?symbol=...&exchange=...&depth=...`
- `GET /api/layer1/microstructure?symbol=...&exchange=...`
- `GET /api/layer1/orderflow?symbol=...&exchange=...`
- `GET /api/layer1/whale-walls?symbol=...&exchange=...`
- `GET /api/layer1/metrics?symbol=...&exchange=...`

## 📁 Project Structure

```
quantumterminal/
├── app/
│   ├── api/                 # API routes for data fetching
│   ├── components/          # React components
│   │   ├── TopBar.tsx      # Header with tickers
│   │   ├── MarketOverview.tsx
│   │   ├── NewsFeed.tsx
│   │   └── ...
│   ├── globals.css         # Global styles and animations
│   └── page.tsx            # Main page component
├── public/                 # Static assets
├── tailwind.config.js      # Tailwind configuration
└── package.json
```

## 🎯 Key Components

### TopBar Component
- Breaking news ticker with smooth marquee animation
- Coin prices ticker with real-time updates
- Navigation menu with keyboard shortcuts

### NewsFeed Component
- Real-time news from CoinDesk RSS
- Pagination with 7 items per page
- Clickable articles that open in new tabs
- Clean, sentiment-free presentation

### Market Overview
- Global market statistics
- Top performers and losers
- Trading signals (educational only)
- Market sentiment indicators

## ⚠️ Disclaimer

**FOR INFORMATIONAL AND EDUCATIONAL PURPOSES ONLY**

This platform is not financial advice. All trading signals and market analysis are for educational purposes only. Always do your own research and consult with financial professionals before making investment decisions.

**Risk Warning**: Cryptocurrency trading involves substantial risk of loss and is not suitable for every investor.

## 📊 Data Sources

Data provided by:
- CoinGecko (prices, market data)
- CoinDesk (news feed)
- Alternative.me (Fear & Greed Index)
- Mempool.space (Bitcoin network fees)
- Blockchain.com (Bitcoin statistics)
- DeFi Llama (Total Value Locked)
- Binance (orderbook snapshots/stream + trading symbol metadata)

## 🤝 Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🌟 Open Source & Support

**Quantum Terminal is 100% open source and free to use!** 🎉

If you find this project helpful and want to support its development:

### 💝 Ways to Support
- **⭐ Star this repository** on GitHub
- **🐛 Report bugs** or **💡 suggest features** via Issues
- **🔧 Contribute code** through Pull Requests
- **📢 Share** with your crypto community
- **💰 Donate** to support ongoing development

### 💰 Donation Options
- **BNB (BNB Smart Chain)**: `0xD4233500BAE4973782c5eaA427A667ABd6FE9e5f`
- **GitHub Sponsors**: [Support on GitHub](https://github.com/sponsors/raydenfly)

Your support helps maintain and improve this educational platform! 🙏

## 🙏 Acknowledgments

- Inspired by Bloomberg Terminal design
- Built with Next.js and the amazing React ecosystem
- Data provided by various cryptocurrency APIs and services

## 📞 Contact

For questions or suggestions, please open an issue on GitHub.

---

**Quantum Terminal** - Professional Crypto Data & Research Platform