import { NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import TvShow from '@/models/TvShow';
import { cookies } from 'next/headers';

export async function GET() {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get('token');
    
    if (!token) {
      return NextResponse.json(
        { success: false, message: 'Unauthorized' },
        { status: 401 }
      );
    }

    await connectToDatabase();
    const shows = await TvShow.find().sort({ title: 1 });
    
    const response = NextResponse.json(shows);
    response.headers.set('Cache-Control', 'public, s-maxage=60, stale-while-revalidate=300');
    
    return response;
  } catch (error) {
    console.error('Error fetching TV shows:', error);
    return NextResponse.json(
      { 
        success: false, 
        message: error instanceof Error ? error.message : 'Failed to fetch TV shows',
        error: error instanceof Error ? error.stack : undefined
      },
      { status: 500 }
    );
  }
} 