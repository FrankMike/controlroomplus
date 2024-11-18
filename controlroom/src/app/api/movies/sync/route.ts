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
    
    let movies;
    try {
      movies = await plexApi.getMovies();
    } catch (error) {
      console.error('Error fetching from Plex:', error);
      return NextResponse.json(
        { success: false, message: 'Failed to fetch movies from Plex' },
        { status: 500 }
      );
    }

    if (!movies || !Array.isArray(movies)) {
      return NextResponse.json(
        { success: false, message: 'Invalid response from Plex API' },
        { status: 500 }
      );
    }

    // Update or insert movies
    try {
      for (const movie of movies) {
        await Movie.findOneAndUpdate(
          { plexId: movie.plexId },
          movie,
          { upsert: true, new: true }
        );
      }
    } catch (error) {
      console.error('Error updating database:', error);
      return NextResponse.json(
        { success: false, message: 'Failed to update movie database' },
        { status: 500 }
      );
    }

    return NextResponse.json({ 
      success: true, 
      message: 'Movies synced successfully',
      count: movies.length
    });
  } catch (error) {
    console.error('Error in movie sync:', error);
    return NextResponse.json(
      { success: false, message: 'An unexpected error occurred' },
      { status: 500 }
    );
  }
} 