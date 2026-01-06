import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Learning from '@/models/Learning';

// GET /api/learning - Get all learning submissions
export async function GET(request: NextRequest) {
  try {
    await connectDB();

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const search = searchParams.get('search');
    const author = searchParams.get('author');
    const category = searchParams.get('category');
    const difficulty = searchParams.get('difficulty');
    const tags = searchParams.get('tags');

    const skip = (page - 1) * limit;

    // Build query
    let query: any = {
      status: 'approved' // Only show approved submissions to users
    };

    if (search) {
      query.$or = [
        { title: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } }
      ];
    }

    if (author) {
      query.author = { $regex: author, $options: 'i' };
    }

    if (category) {
      query.category = category;
    }

    if (difficulty) {
      query.difficulty = parseInt(difficulty);
    }

    if (tags) {
      query.tags = { $in: tags.split(',').map(tag => tag.trim()) };
    }

    // Get total count
    const total = await Learning.countDocuments(query);

    // Get category stats for approved submissions
    const [beginnerCount, intermediateCount, advancedCount] = await Promise.all([
      Learning.countDocuments({ status: 'approved', category: 'beginner' }),
      Learning.countDocuments({ status: 'approved', category: 'intermediate' }),
      Learning.countDocuments({ status: 'approved', category: 'advanced' })
    ]);

    // Get learning submissions
    const learning = await Learning.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean();

    return NextResponse.json({
      success: true,
      data: learning,
      stats: {
        beginner: beginnerCount,
        intermediate: intermediateCount,
        advanced: advancedCount,
        total: beginnerCount + intermediateCount + advancedCount
      },
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    });

  } catch (error) {
    console.error('Error fetching learning:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch learning submissions' },
      { status: 500 }
    );
  }
}

// POST /api/learning - Create a new learning submission
export async function POST(request: NextRequest) {
  try {
    await connectDB();

    const body = await request.json();

    // Validate required fields
    const { title, author, link } = body;
    if (!title || !author || !link) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields: title, author, link' },
        { status: 400 }
      );
    }

    // Create new learning submission
    const learning = new Learning({
      title,
      description: body.description || '',
      author,
      link,
      pdfUrl: body.pdfUrl || '',
      imageUrl: body.imageUrl || '',
      category: body.category || 'beginner',
      difficulty: body.difficulty || 1,
      tags: body.tags || [],
      messageId: body.messageId || '',
      status: 'pending' // All new submissions start as pending
    });

    await learning.save();

    return NextResponse.json({
      success: true,
      data: learning,
      message: 'Learning submission created successfully'
    }, { status: 201 });

  } catch (error: any) {
    console.error('Error creating learning:', error);
    
    if (error.name === 'ValidationError') {
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { success: false, error: 'Failed to create learning submission' },
      { status: 500 }
    );
  }
}

// DELETE /api/learning - Delete a learning submission by ID
export async function DELETE(request: NextRequest) {
  try {
    await connectDB();

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json(
        { success: false, error: 'Learning ID is required' },
        { status: 400 }
      );
    }

    const learning = await Learning.findByIdAndDelete(id);

    if (!learning) {
      return NextResponse.json(
        { success: false, error: 'Learning submission not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: learning,
      message: 'Learning submission deleted successfully'
    });

  } catch (error) {
    console.error('Error deleting learning:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to delete learning submission' },
      { status: 500 }
    );
  }
}
