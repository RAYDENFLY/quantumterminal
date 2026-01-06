import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import TradingSignal from '@/models/TradingSignal';

export const dynamic = 'force-dynamic';

// GET /api/trading-signals - Get all approved trading signals
export async function GET(request: NextRequest) {
  try {
    await connectDB();

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const search = searchParams.get('search');
    const asset = searchParams.get('asset');
    const signal = searchParams.get('signal');
    const tradingStyle = searchParams.get('tradingStyle');
    const signalStatus = searchParams.get('signalStatus');
    const author = searchParams.get('author');

    const skip = (page - 1) * limit;

    // Build query - only show approved signals
    let query: any = {
      status: 'approved'
    };

    if (search) {
      query.$or = [
        { title: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
        { asset: { $regex: search, $options: 'i' } }
      ];
    }

    if (asset) {
      query.asset = { $regex: asset, $options: 'i' };
    }

    if (signal) {
      query.signal = signal;
    }

    if (tradingStyle) {
      query.tradingStyle = tradingStyle;
    }

    if (signalStatus) {
      query.signalStatus = signalStatus;
    }

    if (author) {
      query.author = { $regex: author, $options: 'i' };
    }

    // Get total count
    const total = await TradingSignal.countDocuments(query);

    // Get trading signals
    const signals = await TradingSignal.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean();

    return NextResponse.json({
      success: true,
      data: signals,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    });

  } catch (error) {
    console.error('Error fetching trading signals:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch trading signals' },
      { status: 500 }
    );
  }
}

// POST /api/trading-signals - Create a new trading signal
export async function POST(request: NextRequest) {
  try {
    await connectDB();

    const body = await request.json();

    // Validate required fields
    const { title, author, asset, signal, tradingStyle, conviction, entry, stopLoss } = body;
    if (!title || !author || !asset || !signal || !tradingStyle || !conviction || !entry || !stopLoss) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields: title, author, asset, signal, tradingStyle, conviction, entry, stopLoss' },
        { status: 400 }
      );
    }

    // Validate conviction range
    if (conviction < 1 || conviction > 10) {
      return NextResponse.json(
        { success: false, error: 'Conviction must be between 1 and 10' },
        { status: 400 }
      );
    }

    // Create new trading signal
    const tradingSignal = new TradingSignal({
      title,
      description: body.description || '',
      author,
      asset: asset.toUpperCase(),
      signal,
      tradingStyle,
      conviction,
      signalStatus: 'active', // Default status, admin can update later
      entry,
      stopLoss,
      takeProfit1: body.takeProfit1 || '',
      takeProfit2: body.takeProfit2 || '',
      takeProfit3: body.takeProfit3 || '',
      reasoning: body.reasoning || '',
      link: body.link || '',
      imageUrl: body.image || body.imageUrl || '',
      tags: body.tags || [],
      messageId: body.messageId || '',
      status: 'pending' // All new submissions start as pending
    });

    await tradingSignal.save();

    return NextResponse.json({
      success: true,
      data: tradingSignal,
      message: 'Trading signal submitted successfully and is pending approval'
    }, { status: 201 });

  } catch (error: any) {
    console.error('Error creating trading signal:', error);
    
    if (error.name === 'ValidationError') {
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { success: false, error: 'Failed to create trading signal' },
      { status: 500 }
    );
  }
}
