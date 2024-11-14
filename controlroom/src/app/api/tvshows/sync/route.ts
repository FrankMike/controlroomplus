import { NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import TvShow from '@/models/TvShow';
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

    console.log('Starting TV shows sync...');
    await connectToDatabase();
    const shows = await plexApi.getTvShows();
    console.log(`Retrieved ${shows.length} shows from Plex`);

    let updatedCount = 0;
    for (const show of shows) {
      if (!show) {
        console.log('Skipping null show');
        continue;
      }

      try {
        console.log(`Processing show: ${show.title}`);
        const result = await TvShow.findOneAndUpdate(
          { plexId: show.plexId },
          { $set: show },
          { upsert: true, new: true, runValidators: true }
        );
        console.log(`Updated/inserted show: ${result.title}`);
        updatedCount++;
      } catch (error) {
        console.error(`Error processing show ${show.title}:`, error);
      }
    }

    console.log(`Successfully synced ${updatedCount} TV shows`);
    return NextResponse.json({ 
      success: true, 
      message: `TV shows synced successfully. Updated ${updatedCount} shows.` 
    });
  } catch (error) {
    console.error('Error syncing TV shows:', error);
    return NextResponse.json(
      { 
        success: false, 
        message: error instanceof Error ? error.message : 'Failed to sync TV shows',
        error: error instanceof Error ? error.stack : undefined
      },
      { status: 500 }
    );
  }
} 