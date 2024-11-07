import { NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import { Note } from '@/models/Note';

async function getCurrentUser(request: Request) {
  try {
    const cookie = request.headers.get('cookie');
    
    if (!cookie) {
      console.error('No cookie found in request');
      return null;
    }

    const response = await fetch('http://localhost:3000/api/auth/me', {
      headers: {
        cookie,
      },
    });
    
    if (!response.ok) {
      console.error('Auth check failed:', response.status);
      return null;
    }
    
    const userData = await response.json();
    
    if (!userData || !userData._id) {
      console.error('Invalid user data:', userData);
      return null;
    }
    
    return userData;
  } catch (error) {
    console.error('Error fetching current user:', error);
    return null;
  }
}

export async function GET(request: Request) {
  try {
    console.log('GET /api/notes - Headers:', Object.fromEntries(request.headers));
    
    const user = await getCurrentUser(request);
    console.log('GET /api/notes - User:', user);
    
    if (!user) {
      console.log('GET /api/notes - Unauthorized: No user found');
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectToDatabase();
    const notes = await Note.find({ userId: user._id })
      .sort({ sessionDate: -1 })
      .lean();

    console.log(`GET /api/notes - Found ${notes.length} notes`);
    return NextResponse.json(notes);
  } catch (error) {
    console.error('Failed to fetch notes:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const user = await getCurrentUser(request);
    
    if (!user || !user._id) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    const noteData = await request.json();

    if (!noteData.sessionDate || !noteData.content) {
      return NextResponse.json(
        { error: 'Session date and content are required' },
        { status: 400 }
      );
    }

    await connectToDatabase();

    const newNote = await Note.create({
      userId: user._id.toString(),
      sessionDate: new Date(noteData.sessionDate),
      content: noteData.content,
    });

    return NextResponse.json(newNote);
  } catch (error) {
    console.error('Failed to create note:', error);
    return NextResponse.json(
      { error: 'Failed to create note: ' + (error as Error).message },
      { status: 500 }
    );
  }
}

export async function PUT(request: Request) {
  try {
    const user = await getCurrentUser(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const note = await request.json();
    await connectToDatabase();

    const updatedNote = await Note.findOneAndUpdate(
      { _id: note._id, userId: user._id },
      { ...note, updatedAt: new Date() },
      { new: true }
    );

    if (!updatedNote) {
      return NextResponse.json({ error: 'Note not found' }, { status: 404 });
    }

    return NextResponse.json(updatedNote);
  } catch (error) {
    console.error('Failed to update note:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const user = await getCurrentUser(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    
    await connectToDatabase();
    const result = await Note.deleteOne({ _id: id, userId: user._id });

    if (result.deletedCount === 0) {
      return NextResponse.json({ error: 'Note not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Failed to delete note:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
} 