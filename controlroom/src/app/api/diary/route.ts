import { connectToDatabase } from '@/lib/mongodb';
import { Diary } from '@/models/Diary';
import { NextResponse } from 'next/server';
import { verify } from 'jsonwebtoken';
import { cookies } from 'next/headers';

const JWT_SECRET = 'your-secret-key';

// Get diary entries with search and filter
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search');
    const category = searchParams.get('category');
    
    const cookieStore = await cookies();
    const token = cookieStore.get('token');

    if (!token) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    const decoded = verify(token.value, JWT_SECRET) as { userId: string };
    await connectToDatabase();

    let query: any = { userId: decoded.userId };

    // Add search conditions
    if (search) {
      query.$or = [
        { title: { $regex: search, $options: 'i' } },
        { content: { $regex: search, $options: 'i' } },
        { tags: { $in: [new RegExp(search, 'i')] } }
      ];
    }

    // Add category filter
    if (category) {
      query.category = category;
    }

    const entries = await Diary.find(query).sort({ createdAt: -1 });
    return NextResponse.json(entries);
  } catch (error) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// Create new entry
export async function POST(request: Request) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get('token');

    if (!token) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    const decoded = verify(token.value, JWT_SECRET) as { userId: string };
    const { title, content, category, tags } = await request.json();

    await connectToDatabase();

    const newEntry = new Diary({
      userId: decoded.userId,
      title,
      content,
      category,
      tags
    });

    await newEntry.save();
    return NextResponse.json(newEntry, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
} 