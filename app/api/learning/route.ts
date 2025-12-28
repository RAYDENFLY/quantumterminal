import { NextRequest, NextResponse } from 'next/server';

// In-memory storage for learning resources (in production, use a database)
let learningResources: Array<{
  link: string;
  author: string;
  messageId: string;
  description?: string;
  createdAt: string;
}> = [];

export async function GET() {
  try {
    return NextResponse.json({
      success: true,
      data: learningResources,
    });
  } catch (error) {
    console.error('Error fetching learning resources:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch learning resources' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { link, author, messageId, description } = body;

    // Validate required fields
    if (!link || !author || !messageId) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields: link, author, messageId' },
        { status: 400 }
      );
    }

    // Check if messageId already exists
    const existingResource = learningResources.find(r => r.messageId === messageId);
    if (existingResource) {
      return NextResponse.json(
        { success: false, error: 'Resource with this messageId already exists' },
        { status: 409 }
      );
    }

    // Add new resource
    const newResource = {
      link,
      author,
      messageId,
      description,
      createdAt: new Date().toISOString(),
    };

    learningResources.push(newResource);

    return NextResponse.json({
      success: true,
      data: newResource,
      message: 'Learning resource added successfully',
    });
  } catch (error) {
    console.error('Error adding learning resource:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to add learning resource' },
      { status: 500 }
    );
  }
}
