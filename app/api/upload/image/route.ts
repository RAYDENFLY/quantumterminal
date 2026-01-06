import { NextRequest, NextResponse } from 'next/server';
import imgbbUploader from '@/lib/imgbb';

// POST /api/upload/image - Upload image to ImgBB
export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('image') as File;
    const name = formData.get('name') as string || undefined;
    const expiration = formData.get('expiration') as string || undefined;

    if (!file) {
      return NextResponse.json(
        { success: false, error: 'No image file provided' },
        { status: 400 }
      );
    }

    // Validate file type and size
    const fileInfo = imgbbUploader.getImageInfo(file);
    
    if (!fileInfo.isValidType) {
      return NextResponse.json(
        { success: false, error: 'Invalid file type. Only JPEG, PNG, GIF, WebP, and BMP are allowed' },
        { status: 400 }
      );
    }

    if (!fileInfo.isValidSize) {
      return NextResponse.json(
        { success: false, error: 'File size exceeds 32MB limit' },
        { status: 400 }
      );
    }

    // Upload to ImgBB
    const result = await imgbbUploader.uploadImage(
      file,
      name,
      expiration ? parseInt(expiration) : undefined
    );

    return NextResponse.json({
      success: true,
      data: {
        id: result.data.id,
        title: result.data.title,
        url: result.data.url,
        display_url: result.data.display_url,
        size: result.data.size,
        width: result.data.width,
        height: result.data.height,
        delete_url: result.data.delete_url,
        thumb: result.data.thumb,
        medium: result.data.medium
      },
      message: 'Image uploaded successfully'
    });

  } catch (error: any) {
    console.error('Error uploading image:', error);
    
    return NextResponse.json(
      { 
        success: false, 
        error: error.message || 'Failed to upload image' 
      },
      { status: 500 }
    );
  }
}

// GET /api/upload/image - Get upload info (for testing)
export async function GET() {
  return NextResponse.json({
    success: true,
    info: {
      maxFileSize: '32MB',
      allowedFormats: ['JPEG', 'PNG', 'GIF', 'WebP', 'BMP'],
      service: 'ImgBB',
      endpoint: '/api/upload/image'
    }
  });
}
