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

    console.log('Connecting to database...');
    await connectToDatabase();
    
    console.log('Fetching TV shows from database...');
    const shows = await TvShow.find().sort({ title: 1 });
    console.log('API: Found shows:', shows.length);
    
    // Log a sample show if available
    if (shows.length > 0) {
      console.log('Sample show:', JSON.stringify(shows[0], null, 2));
    }
    
    return NextResponse.json(shows);
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