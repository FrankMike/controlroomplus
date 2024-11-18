import { connectToDatabase } from '@/lib/mongodb';
import { Diary } from '@/models/Diary';
import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

// Get diary entries with search and filter
export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search');
    const category = searchParams.get('category');

    await connectToDatabase();

    let query: any = { userId: session.user.id };

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
    console.error('Error in diary GET:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// Create new entry
export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    const { title, content, category, tags } = await request.json();

    await connectToDatabase();

    const newEntry = new Diary({
      userId: session.user.id,
      title,
      content,
      category,
      tags
    });

    await newEntry.save();
    return NextResponse.json(newEntry, { status: 201 });
  } catch (error) {
    console.error('Error in diary POST:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
} 