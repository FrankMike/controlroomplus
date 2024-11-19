import { NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import TvShow from '@/models/TvShow';
import { plexApi } from '@/lib/plexApi';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

export async function POST() {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session) {
      return NextResponse.json(
        { success: false, message: 'Unauthorized' },
        { status: 401 }
      );
    }

    await connectToDatabase();
    const plexShows = await plexApi.getTvShows();

    // Get all plexIds from the current Plex library
    const currentPlexIds = new Set(plexShows.map(show => show.plexId));

    // Delete shows that are no longer in Plex
    await TvShow.deleteMany({
      plexId: { $nin: Array.from(currentPlexIds) }
    });

    // Update or insert current shows
    for (const show of plexShows) {
      await TvShow.findOneAndUpdate(
        { plexId: show.plexId },
        show,
        { upsert: true, new: true }
      );
    }

    return NextResponse.json({ success: true, message: 'TV shows synced successfully' });
  } catch (error) {
    console.error('Error syncing TV shows:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to sync TV shows' },
      { status: 500 }
    );
  }
} 