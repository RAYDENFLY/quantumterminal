import { NextRequest, NextResponse } from 'next/server';

// In-memory storage for signals (replace with database in production)
let signals: any[] = [
  {
    id: '1',
    title: 'BTC Breakout Signal',
    description: 'Bitcoin showing strong bullish momentum above $50k',
    symbol: 'BTC',
    type: 'BUY',
    price: 50123.45,
    target: 52000,
    stopLoss: 48000,
    timestamp: new Date().toISOString(),
    status: 'ACTIVE'
  },
  {
    id: '2',
    title: 'ETH Accumulation Phase',
    description: 'Ethereum entering accumulation phase after recent dip',
    symbol: 'ETH',
    type: 'HOLD',
    price: 2456.78,
    target: 2800,
    stopLoss: 2200,
    timestamp: new Date().toISOString(),
    status: 'ACTIVE'
  }
];

// GET /api/signals - Get all signals
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');
    const symbol = searchParams.get('symbol');

    let filteredSignals = signals;

    if (status) {
      filteredSignals = filteredSignals.filter(signal => signal.status === status);
    }

    if (symbol) {
      filteredSignals = filteredSignals.filter(signal => signal.symbol === symbol);
    }

    return NextResponse.json({
      success: true,
      data: filteredSignals,
      count: filteredSignals.length
    });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: 'Failed to fetch signals' },
      { status: 500 }
    );
  }
}

// POST /api/signals - Create a new signal
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Validate required fields
    const { title, description, symbol, type, price } = body;
    if (!title || !description || !symbol || !type || !price) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields: title, description, symbol, type, price' },
        { status: 400 }
      );
    }

    const newSignal = {
      id: Date.now().toString(),
      title,
      description,
      symbol,
      type,
      price: parseFloat(price),
      target: body.target ? parseFloat(body.target) : null,
      stopLoss: body.stopLoss ? parseFloat(body.stopLoss) : null,
      timestamp: new Date().toISOString(),
      status: body.status || 'ACTIVE'
    };

    signals.push(newSignal);

    return NextResponse.json({
      success: true,
      data: newSignal,
      message: 'Signal created successfully'
    }, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: 'Failed to create signal' },
      { status: 500 }
    );
  }
}

// PATCH /api/signals - Update a signal
export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json();
    const { id } = body;

    if (!id) {
      return NextResponse.json(
        { success: false, error: 'Signal ID is required' },
        { status: 400 }
      );
    }

    const signalIndex = signals.findIndex(signal => signal.id === id);
    if (signalIndex === -1) {
      return NextResponse.json(
        { success: false, error: 'Signal not found' },
        { status: 404 }
      );
    }

    // Update signal
    signals[signalIndex] = {
      ...signals[signalIndex],
      ...body,
      updatedAt: new Date().toISOString()
    };

    return NextResponse.json({
      success: true,
      data: signals[signalIndex],
      message: 'Signal updated successfully'
    });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: 'Failed to update signal' },
      { status: 500 }
    );
  }
}

// DELETE /api/signals - Delete a signal by ID
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json(
        { success: false, error: 'Signal ID is required' },
        { status: 400 }
      );
    }

    const signalIndex = signals.findIndex(signal => signal.id === id);
    if (signalIndex === -1) {
      return NextResponse.json(
        { success: false, error: 'Signal not found' },
        { status: 404 }
      );
    }

    const deletedSignal = signals.splice(signalIndex, 1)[0];

    return NextResponse.json({
      success: true,
      data: deletedSignal,
      message: 'Signal deleted successfully'
    });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: 'Failed to delete signal' },
      { status: 500 }
    );
  }
}
