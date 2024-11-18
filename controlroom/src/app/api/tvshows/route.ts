import { NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import TvShow from '@/models/TvShow';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session) {
      return NextResponse.json(
        { success: false, message: 'Unauthorized' },
        { status: 401 }
      );
    }

    await connectToDatabase();
    const shows = await TvShow.find().sort({ title: 1 });
    return NextResponse.json(shows);
  } catch (error) {
    console.error('Error fetching TV shows:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to fetch TV shows' },
      { status: 500 }
    );
  }
} 