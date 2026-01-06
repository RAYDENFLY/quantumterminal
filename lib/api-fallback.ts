// API URL configuration with fallback support
export const API_URLS = {
  // Primary URLs for different services
  research: [
    process.env.NEXT_PUBLIC_RESEARCH_API || 'http://localhost:8780/',
    'https://quantumbot-bice.vercel.app/',
    'https://e67255a0-cdbb-406b-9f86-78f58865e1b1-00-2s422x0ck3xxr.pike.replit.dev/api/docs'
  ],
  learning: [
    '/api/learning', // Local API
    'https://quantumbot-bice.vercel.app/api/learning',
    'https://e67255a0-cdbb-406b-9f86-78f58865e1b1-00-2s422x0ck3xxr.pike.replit.dev/api/learning'
  ],
  academy: [
    '/api/academy', // Local API
    'https://quantumbot-bice.vercel.app/api/academy',
    'https://e67255a0-cdbb-406b-9f86-78f58865e1b1-00-2s422x0ck3xxr.pike.replit.dev/api/academy'
  ],
  signals: [
    '/api/trading-signals', // Local API
    'https://quantumbot-bice.vercel.app/api/trading-signals',
    'https://e67255a0-cdbb-406b-9f86-78f58865e1b1-00-2s422x0ck3xxr.pike.replit.dev/api/trading-signals'
  ]
};

// Fallback fetch function that tries multiple URLs
export async function fetchWithFallback(urls: string[], options?: RequestInit): Promise<Response> {
  for (const url of urls) {
    try {
      const response = await fetch(url, options);
      if (response.ok) {
        return response;
      }
    } catch (error) {
      console.warn(`Failed to fetch from ${url}, trying next fallback...`);
      continue;
    }
  }
  throw new Error('All fallback URLs failed');
}

// Helper functions for specific APIs
export async function fetchResearch(endpoint: string = '', options?: RequestInit): Promise<Response> {
  const urls = API_URLS.research.map(url => `${url}${endpoint}`);
  return fetchWithFallback(urls, options);
}

export async function fetchLearning(endpoint: string = '', options?: RequestInit): Promise<Response> {
  const urls = API_URLS.learning.map(url => `${url}${endpoint}`);
  return fetchWithFallback(urls, options);
}

export async function fetchAcademy(endpoint: string = '', options?: RequestInit): Promise<Response> {
  const urls = API_URLS.academy.map(url => `${url}${endpoint}`);
  return fetchWithFallback(urls, options);
}

export async function fetchSignals(endpoint: string = '', options?: RequestInit): Promise<Response> {
  const urls = API_URLS.signals.map(url => `${url}${endpoint}`);
  return fetchWithFallback(urls, options);
}
