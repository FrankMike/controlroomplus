import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import { Note } from "@/models/Note";
import { getToken } from "next-auth/jwt";

async function getCurrentUser(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return null;
  }
  return session.user;
}

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    console.log('Current session:', session);
    
    if (!session?.user) {
      console.log('No session or user found');
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await connectToDatabase();
    
    const notes = await Note.find({ userId: session.user.id })
      .sort({ sessionDate: -1 })
      .lean();

    console.log('Found notes:', notes.length);
    return NextResponse.json(notes);
  } catch (error) {
    console.error("Error in notes GET route:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const user = await getCurrentUser(request);
    
    if (!user || !user.id) {
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
      userId: user.id,
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
      { _id: note._id, userId: user.id },
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
    const result = await Note.deleteOne({ _id: id, userId: user.id });

    if (result.deletedCount === 0) {
      return NextResponse.json({ error: 'Note not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Failed to delete note:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
} 