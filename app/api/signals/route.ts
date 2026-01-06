import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Signals from '@/models/Signals';

// GET /api/signals - Get all signals
export async function GET(request: NextRequest) {
  try {
    await connectDB();

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const search = searchParams.get('search');
    const symbol = searchParams.get('symbol');
    const type = searchParams.get('type');
    const status = searchParams.get('status');
    const tags = searchParams.get('tags');

    const skip = (page - 1) * limit;

    // Build query
    let query: any = {};

    if (search) {
      query.$or = [
        { title: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } }
      ];
    }

    if (symbol) {
      query.symbol = { $regex: symbol, $options: 'i' };
    }

    if (type) {
      query.type = type;
    }

    if (status) {
      query.status = status;
    }

    if (tags) {
      query.tags = { $in: tags.split(',').map(tag => tag.trim()) };
    }

    // Get total count
    const total = await Signals.countDocuments(query);

    // Get signals
    const signals = await Signals.find(query)
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
    console.error('Error fetching signals:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch signals' },
      { status: 500 }
    );
  }
}

// POST /api/signals - Create a new signal
export async function POST(request: NextRequest) {
  try {
    await connectDB();

    const body = await request.json();

    // Validate required fields
    const { title, description, symbol, type, price } = body;
    if (!title || !description || !symbol || !type || !price) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields: title, description, symbol, type, price' },
        { status: 400 }
      );
    }

    // Create new signal
    const signal = new Signals({
      title,
      description,
      symbol,
      type,
      price: parseFloat(price),
      target: body.target ? parseFloat(body.target) : undefined,
      stopLoss: body.stopLoss ? parseFloat(body.stopLoss) : undefined,
      status: body.status || 'ACTIVE',
      performance: body.performance || { pnl: 0, percentage: 0 },
      tags: body.tags || []
    });

    await signal.save();

    return NextResponse.json({
      success: true,
      data: signal,
      message: 'Signal created successfully'
    }, { status: 201 });

  } catch (error: any) {
    console.error('Error creating signal:', error);
    
    if (error.name === 'ValidationError') {
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { success: false, error: 'Failed to create signal' },
      { status: 500 }
    );
  }
}

// PATCH /api/signals - Update a signal
export async function PATCH(request: NextRequest) {
  try {
    await connectDB();

    const body = await request.json();
    const { id, ...updateData } = body;

    if (!id) {
      return NextResponse.json(
        { success: false, error: 'Signal ID is required' },
        { status: 400 }
      );
    }

    // Convert price fields to numbers if provided
    if (updateData.price) updateData.price = parseFloat(updateData.price);
    if (updateData.target) updateData.target = parseFloat(updateData.target);
    if (updateData.stopLoss) updateData.stopLoss = parseFloat(updateData.stopLoss);

    const signal = await Signals.findByIdAndUpdate(
      id,
      updateData,
      { new: true, runValidators: true }
    );

    if (!signal) {
      return NextResponse.json(
        { success: false, error: 'Signal not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: signal,
      message: 'Signal updated successfully'
    });

  } catch (error: any) {
    console.error('Error updating signal:', error);
    
    if (error.name === 'ValidationError') {
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { success: false, error: 'Failed to update signal' },
      { status: 500 }
    );
  }
}

// DELETE /api/signals - Delete a signal by ID
export async function DELETE(request: NextRequest) {
  try {
    await connectDB();

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json(
        { success: false, error: 'Signal ID is required' },
        { status: 400 }
      );
    }

    const signal = await Signals.findByIdAndDelete(id);

    if (!signal) {
      return NextResponse.json(
        { success: false, error: 'Signal not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: signal,
      message: 'Signal deleted successfully'
    });

  } catch (error) {
    console.error('Error deleting signal:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to delete signal' },
      { status: 500 }
    );
  }
}
