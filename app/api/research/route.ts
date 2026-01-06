import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Research from '@/models/Research';

// GET /api/research - Get all research submissions
export async function GET(request: NextRequest) {
  try {
    await connectDB();

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const search = searchParams.get('search');
    const author = searchParams.get('author');
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

    if (tags) {
      query.tags = { $in: tags.split(',').map(tag => tag.trim()) };
    }

    // Get total count
    const total = await Research.countDocuments(query);

    // Get research submissions
    const research = await Research.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean();

    return NextResponse.json({
      success: true,
      research: research, // Change from 'data' to 'research' to match expected format
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    });

  } catch (error) {
    console.error('Error fetching research:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch research submissions' },
      { status: 500 }
    );
  }
}

// POST /api/research - Create a new research submission
export async function POST(request: NextRequest) {
  try {
    await connectDB();

    const body = await request.json();
    console.log('Research POST body:', body);

    // Validate required fields
    const { title, author, link } = body;
    if (!title || !author || !link) {
      console.log('Validation failed:', { title: !!title, author: !!author, link: !!link });
      return NextResponse.json(
        { success: false, error: 'Missing required fields: title, author, link' },
        { status: 400 }
      );
    }

    // Create new research submission
    const research = new Research({
      title,
      description: body.description || '',
      author,
      link,
      pdfUrl: body.pdfUrl || '',
      imageUrl: body.imageUrl || '',
      tags: body.tags || [],
      messageId: body.messageId || '',
      status: 'pending' // All new submissions start as pending
    });

    await research.save();

    return NextResponse.json({
      success: true,
      data: research,
      message: 'Research submission created successfully'
    }, { status: 201 });

  } catch (error: any) {
    console.error('Error creating research:', error);
    
    if (error.name === 'ValidationError') {
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { success: false, error: 'Failed to create research submission' },
      { status: 500 }
    );
  }
}

// DELETE /api/research - Delete a research submission by ID
export async function DELETE(request: NextRequest) {
  try {
    await connectDB();

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json(
        { success: false, error: 'Research ID is required' },
        { status: 400 }
      );
    }

    const research = await Research.findByIdAndDelete(id);

    if (!research) {
      return NextResponse.json(
        { success: false, error: 'Research submission not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: research,
      message: 'Research submission deleted successfully'
    });

  } catch (error) {
    console.error('Error deleting research:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to delete research submission' },
      { status: 500 }
    );
  }
}
