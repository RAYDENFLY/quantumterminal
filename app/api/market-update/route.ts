import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import MarketUpdate from '@/models/MarketUpdate';
import mongoose from 'mongoose';

// GET /api/market-update - Get all approved market updates (public)
// GET /api/market-update?all=true - Get all market updates (admin only)
export async function GET(request: NextRequest) {
  try {
    await connectDB();

    const { searchParams } = new URL(request.url);
  const id = searchParams.get('id');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const search = searchParams.get('search');
    const type = searchParams.get('type');
    const priority = searchParams.get('priority');
    const status = searchParams.get('status');
    const all = searchParams.get('all') === 'true';

    // GET /api/market-update?id=<id> - Get a single approved market update (public)
    if (id) {
      if (!mongoose.Types.ObjectId.isValid(id)) {
        return NextResponse.json({ success: false, error: 'Invalid id' }, { status: 400 });
      }
      const query: any = { _id: id };
      // Public access: only show approved & published
      if (!all) {
        query.status = 'approved';
        query.publishDate = { $lte: new Date() };
      }

      const update = await MarketUpdate.findOne(query).lean();
      if (!update) {
        return NextResponse.json({ success: false, error: 'Market update not found' }, { status: 404 });
      }

      return NextResponse.json({ success: true, data: update });
    }

    const skip = (page - 1) * limit;

    // Build query
    let query: any = {};

    // If not admin requesting all, only show approved and published updates
    if (!all) {
      query.status = 'approved';
      query.publishDate = { $lte: new Date() };
    }

    if (search) {
      query.$or = [
        { title: { $regex: search, $options: 'i' } },
        { content: { $regex: search, $options: 'i' } }
      ];
    }

    if (type) {
      query.type = type;
    }

    if (priority) {
      query.priority = priority;
    }

    if (status && all) {
      query.status = status;
    }

    // Get total count
    const total = await MarketUpdate.countDocuments(query);

    // Get market updates
    const updates = await MarketUpdate.find(query)
      .sort({ publishDate: -1, createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean();

    return NextResponse.json({
      success: true,
      data: updates,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    });

  } catch (error) {
    console.error('Error fetching market updates:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch market updates' },
      { status: 500 }
    );
  }
}

// POST /api/market-update - Create a new market update (public submission)
export async function POST(request: NextRequest) {
  try {
    await connectDB();

    const body = await request.json();

    // Validate required fields
    const { title, content, author, type } = body;
    if (!title || !content || !author || !type) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields: title, content, author, type' },
        { status: 400 }
      );
    }

    // Create new market update (pending approval)
    const update = new MarketUpdate({
      title,
      content,
      author,
      type,
      imageUrl: body.imageUrl,
      tags: body.tags || [],
      priority: body.priority || 'medium',
      status: 'pending' // Always pending for public submissions
    });

    await update.save();

    return NextResponse.json({
      success: true,
      data: update,
      message: 'Market update submitted successfully and is pending approval'
    }, { status: 201 });

  } catch (error: any) {
    console.error('Error creating market update:', error);
    
    if (error.name === 'ValidationError') {
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { success: false, error: 'Failed to create market update' },
      { status: 500 }
    );
  }
}

// DELETE /api/market-update - Delete a market update by ID (admin only)
export async function DELETE(request: NextRequest) {
  try {
    await connectDB();

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json(
        { success: false, error: 'Market update ID is required' },
        { status: 400 }
      );
    }

    const update = await MarketUpdate.findByIdAndDelete(id);

    if (!update) {
      return NextResponse.json(
        { success: false, error: 'Market update not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: update,
      message: 'Market update deleted successfully'
    });

  } catch (error) {
    console.error('Error deleting market update:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to delete market update' },
      { status: 500 }
    );
  }
}