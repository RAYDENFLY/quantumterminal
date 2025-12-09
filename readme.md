# Quantum Terminal

A professional cryptocurrency trading dashboard inspired by Bloomberg Terminal, built with Next.js, React, and TypeScript. Features real-time market data, news aggregation, on-chain analytics, and educational resources.

![Quantum Terminal Preview](https://via.placeholder.com/800x400/1a1a1a/00ff88?text=Quantum+Terminal+Preview)

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

## 🚀 Quick Start

### Prerequisites
- Node.js 18+
- npm or yarn

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/yourusername/quantumterm.git
   cd quantumterm
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

## 📁 Project Structure

```
quantumterm/
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