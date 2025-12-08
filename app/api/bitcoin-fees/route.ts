import { NextResponse } from 'next/server';

export async function GET() {
  try {
    const response = await fetch('https://mempool.space/api/v1/fees/recommended', {
      next: { revalidate: 60 } // Cache for 60 seconds
    });

    if (!response.ok) {
      throw new Error('Failed to fetch Bitcoin fees');
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error('Error fetching Bitcoin fees:', error);
    return NextResponse.json(
      { error: 'Failed to fetch Bitcoin fees' },
      { status: 500 }
    );
  }
}