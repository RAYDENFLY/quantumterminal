import { NextResponse } from 'next/server';

export const runtime = 'nodejs';

type GitHubCommitApiItem = {
  sha: string;
  html_url: string;
  commit: {
    message: string;
    author: {
      name: string;
      date: string;
    } | null;
    committer: {
      name: string;
      date: string;
    } | null;
  };
};

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const limit = Math.min(Math.max(Number(searchParams.get('limit') ?? '20') || 20, 1), 50);

  const owner = 'RAYDENFLY';
  const repo = 'quantumterminal';
  const sha = 'main';

  const url = `https://api.github.com/repos/${owner}/${repo}/commits?sha=${sha}&per_page=${limit}`;

  const headers: Record<string, string> = {
    Accept: 'application/vnd.github+json',
    'User-Agent': 'quantumterminal',
  };

  // Optional: set GITHUB_TOKEN in Vercel for higher rate limits.
  const token = process.env.GITHUB_TOKEN;
  if (token) headers.Authorization = `Bearer ${token}`;

  const res = await fetch(url, {
    headers,
    // Cache on the server to reduce GitHub rate limit pressure.
    next: { revalidate: 60 * 10 },
  });

  if (!res.ok) {
    const text = await res.text().catch(() => '');
    return NextResponse.json(
      {
        success: false,
        error: `Failed to fetch changelog (${res.status})`,
        details: text.slice(0, 500),
      },
      { status: 502 }
    );
  }

  const data = (await res.json()) as GitHubCommitApiItem[];

  const items = data.map((c) => {
    const authorName = c.commit.author?.name ?? c.commit.committer?.name ?? 'Unknown';
    const isoDate = c.commit.author?.date ?? c.commit.committer?.date ?? null;

    // Use first line as title, rest as body.
    const message = c.commit.message || '';
    const [title, ...rest] = message.split('\n');

    return {
      sha: c.sha,
      shortSha: c.sha.slice(0, 7),
      url: c.html_url,
      title: title.trim(),
      body: rest.join('\n').trim() || null,
      author: authorName,
      date: isoDate,
    };
  });

  return NextResponse.json({ success: true, items }, { status: 200 });
}
