import "./globals.css";
import type { Metadata, Viewport } from 'next';

const siteConfig = {
  name: 'Quantum Terminal',
  description: 'Professional crypto trading terminal with real-time market data, on-chain analytics, whale tracking, trading signals, and research tools. Bloomberg Terminal style interface for active crypto traders and investors.',
  url: 'https://quantumterminal.vercel.app',
  ogImage: 'https://quantumterminal.vercel.app/og-image.png',
  keywords: [
    'crypto trading terminal',
    'cryptocurrency analytics',
    'bitcoin price tracker',
    'ethereum analytics',
    'on-chain analysis',
    'whale tracking',
    'crypto market data',
    'defi analytics',
    'trading signals',
    'crypto research',
    'fear greed index crypto',
    'crypto news aggregator',
    'bitcoin dominance',
    'altcoin season index',
    'crypto portfolio tracker',
    'real-time crypto prices',
    'blockchain analytics platform',
    'crypto terminal bloomberg style'
  ],
};

export const metadata: Metadata = {
  // Basic metadata
  title: {
    default: 'Quantum Terminal | Professional Crypto Trading Terminal & Analytics',
    template: '%s | Quantum Terminal'
  },
  description: siteConfig.description,
  keywords: siteConfig.keywords,
  
  // Canonical URL
  metadataBase: new URL(siteConfig.url),
  alternates: {
    canonical: '/',
  },
  
  // Robots
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  
  // Open Graph
  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: siteConfig.url,
    title: 'Quantum Terminal | Professional Crypto Trading Terminal',
    description: siteConfig.description,
    siteName: siteConfig.name,
    images: [
      {
        url: siteConfig.ogImage,
        width: 1200,
        height: 630,
        alt: 'Quantum Terminal - Professional Crypto Trading Dashboard',
      },
    ],
  },
  
  // Twitter Card
  twitter: {
    card: 'summary_large_image',
    title: 'Quantum Terminal | Professional Crypto Trading Terminal',
    description: siteConfig.description,
    images: [siteConfig.ogImage],
    creator: '@quantumterminal',
  },
  
  // App specific
  applicationName: siteConfig.name,
  authors: [{ name: 'Quantum Terminal Team', url: siteConfig.url }],
  generator: 'Next.js',
  referrer: 'origin-when-cross-origin',
  creator: 'Quantum Terminal',
  publisher: 'Quantum Terminal',
  
  // Verification (add your codes here)
  verification: {
    google: 'googleafe6ceb53aa046db',
    // yandex: 'your-yandex-verification-code',
    // bing: 'your-bing-verification-code',
  },
  
  // Icons
  icons: {
  icon: '/qt.png',
  shortcut: '/qt.png',
  apple: '/apple-touch-icon.png',
  },
  
  // Manifest for PWA
  manifest: '/manifest.json',
  
  // Category
  category: 'finance',
};

export const viewport: Viewport = {
  themeColor: '#0a0e27',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  // JSON-LD structured data for SEO
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'WebApplication',
    name: 'Quantum Terminal',
    description: 'Professional crypto trading terminal with real-time market data, on-chain analytics, and research tools.',
    url: 'https://quantumterminal.vercel.app',
    applicationCategory: 'FinanceApplication',
    operatingSystem: 'Web Browser',
    offers: {
      '@type': 'Offer',
      price: '0',
      priceCurrency: 'USD',
    },
    aggregateRating: {
      '@type': 'AggregateRating',
      ratingValue: '4.8',
      ratingCount: '150',
    },
    featureList: [
      'Real-time cryptocurrency prices',
      'On-chain analytics',
      'Whale tracking alerts',
      'Trading signals',
      'Market news aggregation',
      'Fear & Greed Index',
      'DeFi TVL tracking',
      'Research papers',
    ],
  };

  const organizationJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: 'Quantum Terminal',
    url: 'https://quantumterminal.vercel.app',
  logo: 'https://quantumterminal.vercel.app/qt.png',
    sameAs: [
      'https://github.com/RAYDENFLY/quantumterminal',
    ],
  };

  return (
    <html lang="en">
      <head>
        {/* Preconnect for performance */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        
        {/* Font with display=swap for better CLS */}
        <link
          href="https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@300;400;500;700&display=swap"
          rel="stylesheet"
        />
        
        {/* JSON-LD Structured Data */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationJsonLd) }}
        />

      </head>
      <body className="antialiased">
  {children}
      </body>
    </html>
  );
}
