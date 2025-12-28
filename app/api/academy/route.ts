import { NextRequest, NextResponse } from 'next/server';

// In-memory storage for academy resources (in production, use a database)
let academyResources: Array<{
  link: string;
  author: string;
  deskripsi: string;
  messageId: string;
  createdAt: string;
}> = [];

export async function GET() {
  try {
    return NextResponse.json({
      success: true,
      data: academyResources,
    });
  } catch (error) {
    console.error('Error fetching academy resources:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch academy resources' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { link, author, deskripsi, messageId } = body;

    // Validate required fields
    if (!link || !author || !deskripsi || !messageId) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields: link, author, deskripsi, messageId' },
        { status: 400 }
      );
    }

    // Check if messageId already exists
    const existingResource = academyResources.find(r => r.messageId === messageId);
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
      deskripsi,
      messageId,
      createdAt: new Date().toISOString(),
    };

    academyResources.push(newResource);

    return NextResponse.json({
      success: true,
      data: newResource,
      message: 'Academy resource added successfully',
    });
  } catch (error) {
    console.error('Error adding academy resource:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to add academy resource' },
      { status: 500 }
    );
  }
}
