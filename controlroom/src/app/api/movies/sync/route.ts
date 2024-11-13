import { NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import Movie from '@/models/Movie';
import { plexApi } from '@/lib/plexApi';
import { cookies } from 'next/headers';

export async function POST() {
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
    const movies = await plexApi.getMovies();

    // Update or insert movies
    for (const movie of movies) {
      await Movie.findOneAndUpdate(
        { plexId: movie.plexId },
        movie,
        { upsert: true, new: true }
      );
    }

    return NextResponse.json({ success: true, message: 'Movies synced successfully' });
  } catch (error) {
    console.error('Error syncing movies:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to sync movies' },
      { status: 500 }
    );
  }
} 