import { connectToDatabase } from '@/lib/mongodb';
import { Diary } from '@/models/Diary';
import { NextResponse } from 'next/server';
import { verify } from 'jsonwebtoken';
import { cookies } from 'next/headers';

const JWT_SECRET = 'your-secret-key';

// Update entry
export async function PUT(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get('token');

    if (!token) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    const decoded = verify(token.value, JWT_SECRET) as { userId: string };
    const { title, content, category, tags } = await request.json();

    await connectToDatabase();

    const entry = await Diary.findOne({
      _id: params.id,
      userId: decoded.userId
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
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// Delete entry
export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get('token');

    if (!token) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    const decoded = verify(token.value, JWT_SECRET) as { userId: string };
    await connectToDatabase();

    const entry = await Diary.findOneAndDelete({
      _id: params.id,
      userId: decoded.userId
    });

    if (!entry) {
      return NextResponse.json({ error: 'Entry not found' }, { status: 404 });
    }

    return NextResponse.json({ message: 'Entry deleted successfully' });
  } catch (error) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
} 