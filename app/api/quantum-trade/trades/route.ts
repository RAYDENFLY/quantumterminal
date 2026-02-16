import { NextResponse } from 'next/server';
import { getQuantumTradeBaseUrl } from '@/lib/quantumTrade/config';

export const runtime = 'nodejs';

export async function GET() {
  try {
    const base = getQuantumTradeBaseUrl();
    const upstream = await fetch(`${base}/api/trades`, { cache: 'no-store' });
    const json = await upstream.json().catch(() => null);

    if (!upstream.ok) {
      return NextResponse.json(
        { success: false, error: `Upstream error (${upstream.status})`, details: json },
        { status: 502 }
      );
    }

    return NextResponse.json({ success: true, data: json });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: 'Failed to fetch Quantum Trade trades', details: err?.message },
      { status: 500 }
    );
  }
}
