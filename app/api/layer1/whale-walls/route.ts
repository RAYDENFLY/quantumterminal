import { NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import WhaleWallLog from '@/models/WhaleWallLog';

export const runtime = 'nodejs';

function sanitizeSymbol(v: any) {
  const s = String(v ?? '').trim().toUpperCase();
  if (!s) return null;
  if (!/^[A-Z0-9:_-]{2,20}$/.test(s)) return null;
  return s;
}

function toNum(v: any) {
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
}

function sanitizeSide(v: any) {
  const s = String(v ?? '').trim().toUpperCase();
  if (s === 'BID' || s === 'ASK') return s as 'BID' | 'ASK';
  return null;
}

function makeEventKey(input: {
  symbol: string;
  exchange: string;
  side: 'BID' | 'ASK';
  price: number;
  notional_usdt: number;
  bucketSec: number;
}) {
  // Round price to reduce duplicates from small jitter.
  const roundedPrice = Number(input.price.toFixed(4));
  const bucket = Math.floor(Date.now() / (input.bucketSec * 1000));
  return `${input.exchange}:${input.symbol}:${input.side}:${roundedPrice}:${bucket}`;
}

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const symbol = sanitizeSymbol(searchParams.get('symbol'));
    const limit = Math.max(10, Math.min(200, Number(searchParams.get('limit') ?? '50') || 50));

    await connectDB();

    const q: any = {};
    if (symbol) q.symbol = symbol;

    const docs = await WhaleWallLog.find(q)
      .sort({ created_at: -1 })
      .limit(limit)
      .lean();

    return NextResponse.json(
      { success: true, data: { logs: docs } },
      { headers: { 'Cache-Control': 'no-store' } }
    );
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: 'Failed to load whale wall logs', details: err?.message },
      { status: 500 }
    );
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => null);

    const symbol = sanitizeSymbol(body?.symbol);
    const exchange = String(body?.exchange ?? 'binance-futures');
    const side = sanitizeSide(body?.side);
    const price = toNum(body?.price);
    const qty = toNum(body?.qty);
    const notional_usdt = toNum(body?.notional_usdt);
    const threshold_usdt = toNum(body?.threshold_usdt);

    if (!symbol || !side || price == null || qty == null || notional_usdt == null || threshold_usdt == null) {
      return NextResponse.json({ success: false, error: 'Invalid payload' }, { status: 400 });
    }

    // Basic guard: only store if flagged above threshold.
    if (notional_usdt < threshold_usdt) {
      return NextResponse.json({ success: true, data: { stored: false, reason: 'below-threshold' } });
    }

    await connectDB();

    const event_key = makeEventKey({
      symbol,
      exchange,
      side,
      price,
      notional_usdt,
      bucketSec: 10,
    });

    try {
      await WhaleWallLog.create({
        symbol,
        exchange,
        side,
        price,
        qty,
        notional_usdt,
        threshold_usdt,
        event_key,
      });
      return NextResponse.json({ success: true, data: { stored: true } }, { headers: { 'Cache-Control': 'no-store' } });
    } catch (e: any) {
      // Duplicate => treat as ok.
      if (String(e?.code) === '11000') {
        return NextResponse.json({ success: true, data: { stored: false, reason: 'duplicate' } }, { headers: { 'Cache-Control': 'no-store' } });
      }
      throw e;
    }
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: 'Failed to store whale wall log', details: err?.message },
      { status: 500 }
    );
  }
}

export async function DELETE(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const symbol = sanitizeSymbol(searchParams.get('symbol'));
    if (!symbol) return NextResponse.json({ success: false, error: 'Invalid symbol' }, { status: 400 });

    await connectDB();
    const res = await WhaleWallLog.deleteMany({ symbol });

    return NextResponse.json(
      { success: true, data: { deleted: res?.deletedCount ?? 0 } },
      { headers: { 'Cache-Control': 'no-store' } }
    );
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: 'Failed to clear whale wall logs', details: err?.message },
      { status: 500 }
    );
  }
}
