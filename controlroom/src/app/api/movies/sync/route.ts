import { NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import Movie from '@/models/Movie';
import { plexApi } from '@/lib/plexApi';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

export async function POST() {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return NextResponse.json(
        { success: false, message: 'You must be logged in to sync movies' },
        { status: 401 }
      );
    }

    await connectToDatabase();
    const plexMovies = await plexApi.getMovies();

    if (!plexMovies || !Array.isArray(plexMovies)) {
      return NextResponse.json(
        { success: false, message: 'Invalid response from Plex API' },
        { status: 500 }
      );
    }

    // Get all plexIds from the current Plex library
    const currentPlexIds = new Set(plexMovies.map(movie => movie.plexId));

    // Delete movies that are no longer in Plex
    await Movie.deleteMany({
      plexId: { $nin: Array.from(currentPlexIds) }
    });

    // Update or insert current movies
    for (const movie of plexMovies) {
      await Movie.findOneAndUpdate(
        { plexId: movie.plexId },
        movie,
        { upsert: true, new: true }
      );
    }

    return NextResponse.json({ 
      success: true, 
      message: 'Movies synced successfully',
      count: plexMovies.length
    });
  } catch (error) {
    console.error('Error in movie sync:', error);
    return NextResponse.json(
      { success: false, message: 'An unexpected error occurred' },
      { status: 500 }
    );
  }
} 