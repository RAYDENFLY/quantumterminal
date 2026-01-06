import type { NextRequest } from 'next/server';

function escapeXml(value: string) {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

export async function GET(_req: NextRequest) {
  const baseUrl = 'https://quantumterminal.vercel.app';
  const lastmod = new Date().toISOString();

  // IMPORTANT (Google spec):
  // - <loc> must be absolute
  // - no URL fragments (#...)
  // - only include indexable, canonical URLs
  const urls = [baseUrl];

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls
  .map(
    (url) => `  <url>
    <loc>${escapeXml(url)}</loc>
    <lastmod>${lastmod}</lastmod>
    <changefreq>hourly</changefreq>
    <priority>1.0</priority>
  </url>`
  )
  .join('\n')}
</urlset>
`;

  return new Response(xml, {
    headers: {
      // This header is what GSC uses to detect sitemap type.
      'Content-Type': 'application/xml; charset=utf-8',
      // Cache safely on Vercel; sitemap changes can be revalidated.
      'Cache-Control': 'public, max-age=0, s-maxage=3600, stale-while-revalidate=86400',
    },
  });
}
