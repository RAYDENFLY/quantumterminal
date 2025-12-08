import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';
export const revalidate = 120;

export async function GET() {
  try {
    // Using a more reliable news source - CoinDesk RSS feed
    const response = await fetch(
      'https://www.coindesk.com/arc/outboundfeeds/rss/',
      {
        headers: {
          'Accept': 'application/rss+xml, application/xml, text/xml',
          'User-Agent': 'Mozilla/5.0 (compatible; QuantumTerminal/1.0)',
        },
        next: { revalidate: 120 }
      }
    );

    if (!response.ok) {
      // Fallback to mock data if RSS fails
      console.warn('RSS feed failed, using mock data');
      return NextResponse.json({
        results: [
          {
            id: '1',
            title: 'Bitcoin Surges Past $100,000 in Historic Rally',
            published_at: new Date().toISOString(),
            domain: 'coindesk.com',
            slug: 'bitcoin-surges',
            kind: 'news',
            source: {
              title: 'CoinDesk',
              domain: 'coindesk.com'
            },
            votes: {
              positive: 85,
              negative: 15
            }
          },
          {
            id: '2',
            title: 'Ethereum 2.0 Upgrade Shows Promising Results',
            published_at: new Date(Date.now() - 3600000).toISOString(),
            domain: 'cointelegraph.com',
            slug: 'ethereum-upgrade',
            kind: 'news',
            source: {
              title: 'CoinTelegraph',
              domain: 'cointelegraph.com'
            },
            votes: {
              positive: 92,
              negative: 8
            }
          },
          {
            id: '3',
            title: 'SEC Approves New Bitcoin ETF Applications',
            published_at: new Date(Date.now() - 7200000).toISOString(),
            domain: 'bloomberg.com',
            slug: 'sec-bitcoin-etf',
            kind: 'news',
            source: {
              title: 'Bloomberg',
              domain: 'bloomberg.com'
            },
            votes: {
              positive: 78,
              negative: 22
            }
          },
          {
            id: '4',
            title: 'DeFi Protocols See Record TVL Growth',
            published_at: new Date(Date.now() - 10800000).toISOString(),
            domain: 'defipulse.com',
            slug: 'defi-tvl-growth',
            kind: 'news',
            source: {
              title: 'DeFi Pulse',
              domain: 'defipulse.com'
            },
            votes: {
              positive: 88,
              negative: 12
            }
          },
          {
            id: '5',
            title: 'Major Bank Announces Crypto Custody Service',
            published_at: new Date(Date.now() - 14400000).toISOString(),
            domain: 'reuters.com',
            slug: 'bank-crypto-custody',
            kind: 'news',
            source: {
              title: 'Reuters',
              domain: 'reuters.com'
            },
            votes: {
              positive: 65,
              negative: 35
            }
          }
        ]
      });
    }

    // Parse RSS feed (simplified - in production you'd use a proper RSS parser)
    const rssText = await response.text();

    // Extract basic news items from RSS (simplified parsing)
    const items = [];
    const itemRegex = /<item>(.*?)<\/item>/gs;
    let match;

    while ((match = itemRegex.exec(rssText)) !== null) {
      const itemText = match[1];
      const titleMatch = itemText.match(/<title><!\[CDATA\[(.*?)\]\]><\/title>/) || itemText.match(/<title>(.*?)<\/title>/);
      const linkMatch = itemText.match(/<link>(.*?)<\/link>/);
      const pubDateMatch = itemText.match(/<pubDate>(.*?)<\/pubDate>/);

      if (titleMatch && linkMatch) {
        items.push({
          id: Math.random().toString(36).substr(2, 9),
          title: titleMatch[1],
          published_at: pubDateMatch ? new Date(pubDateMatch[1]).toISOString() : new Date().toISOString(),
          domain: new URL(linkMatch[1]).hostname,
          slug: Math.random().toString(36).substr(2, 9),
          kind: 'news',
          source: {
            title: new URL(linkMatch[1]).hostname,
            domain: new URL(linkMatch[1]).hostname
          },
          votes: {
            positive: Math.floor(Math.random() * 100),
            negative: Math.floor(Math.random() * 20)
          }
        });
      }

      if (items.length >= 10) break;
    }

    return NextResponse.json({ results: items });
  } catch (error) {
    console.error('Error fetching news:', error);

    // Final fallback - return mock data
    return NextResponse.json({
      results: [
        {
          id: 'fallback-1',
          title: 'Market Update: Crypto Markets Show Resilience',
          published_at: new Date().toISOString(),
          domain: 'quantumterminal.com',
          slug: 'market-update',
          kind: 'news',
          source: {
            title: 'Quantum Terminal',
            domain: 'quantumterminal.com'
          },
          votes: {
            positive: 75,
            negative: 25
          }
        }
      ]
    });
  }
}
