import { connectToDatabase } from '@/lib/mongodb';
import { Diary } from '@/models/Diary';
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';

export async function PUT(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    // Await the params promise
    const params = await context.params;
    const { id } = params;

    if (!id) {
      return NextResponse.json({ error: 'Invalid ID' }, { status: 400 });
    }
    
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    const { title, content, category, tags } = await request.json();

    // Input validation
    if (!title || !content) {
      return NextResponse.json({ error: 'Title and content are required' }, { status: 400 });
    }

    await connectToDatabase();

    const entry = await Diary.findOne({
      _id: id,
      userId: session.user.id
    });

    if (!entry) {
      return NextResponse.json({ error: 'Entry not found' }, { status: 404 });
    }

    entry.title = title;
    entry.content = content;
    entry.category = category;
    entry.tags = tags;
    await entry.save();

    return NextResponse.json(entry);
  } catch (error) {
    console.error('Error in diary PUT:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(
  _request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    // Await the params promise
    const params = await context.params;
    const { id } = params;
    
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    await connectToDatabase();

    const entry = await Diary.findOneAndDelete({
      _id: id,
      userId: session.user.id
    });

    if (!entry) {
      return NextResponse.json({ error: 'Entry not found' }, { status: 404 });
    }

    return NextResponse.json({ message: 'Entry deleted successfully' });
  } catch (error) {
    console.error('Error in diary DELETE:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

