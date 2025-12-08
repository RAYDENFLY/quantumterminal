import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Quantum Terminal - Crypto Data & Research Platform",
  description: "Real-time crypto market data, blockchain analytics, research papers, and market indicators in Bloomberg Terminal style",
  keywords: ["crypto", "blockchain", "terminal", "market data", "on-chain analytics"],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <link
          href="https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@300;400;500;700&display=swap"
          rel="stylesheet"
        />
        <script src="https://cdn.tailwindcss.com"></script>
        <script>
          {`
            tailwind.config = {
              theme: {
                extend: {
                  colors: {
                    terminal: {
                      bg: '#0a0e27',
                      panel: '#0f172a',
                      border: '#1e293b',
                      text: '#e2e8f0',
                      accent: '#38bdf8',
                      success: '#10b981',
                      danger: '#ef4444',
                      warning: '#f59e0b',
                    },
                  },
                  fontFamily: {
                    mono: ['JetBrains Mono', 'Courier New', 'monospace'],
                  },
                  animation: {
                    marquee: 'marquee 30s linear infinite',
                  },
                  keyframes: {
                    marquee: {
                      '0%': { transform: 'translateX(0%)' },
                      '100%': { transform: 'translateX(-50%)' },
                    },
                  },
                },
              },
            }
          `}
        </script>
      </head>
      <body className="antialiased">
        {children}
      </body>
    </html>
  );
}
