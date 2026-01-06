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

    // Map form fields to expected API fields
    const {
      author, // Now from form
      asset,
      direction, // maps to 'signal'
      tradingStyle,
      conviction,
      entryPrice, // maps to 'entry'
      stopLoss,
      takeProfit1,
      takeProfit2,
      takeProfit3,
      reasoning, // maps to 'reasoning'
      image // maps to 'imageUrl'
    } = body;

    // Validate required fields from form
    if (!author || !asset || !direction || !tradingStyle || !conviction || !entryPrice || !stopLoss || !reasoning) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields: author, asset, direction, tradingStyle, conviction, entryPrice, stopLoss, reasoning' },
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

    // Generate title automatically
    const title = `${direction} ${asset} - ${tradingStyle}`;

    // Create new trading signal
    const tradingSignal = new TradingSignal({
      title,
      description: `${direction} signal for ${asset} with ${conviction}/10 conviction`,
      author,
      asset: asset.toUpperCase(),
      signal: direction, // Use direction as signal
      tradingStyle,
      conviction,
      signalStatus: 'active', // Default status, admin can update later
      entry: entryPrice, // Map entryPrice to entry
      stopLoss,
      takeProfit1: takeProfit1 || '',
      takeProfit2: takeProfit2 || '',
      takeProfit3: takeProfit3 || '',
      reasoning: reasoning || '',
      link: body.link || '',
      imageUrl: image || '',
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
