import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import Transaction from '@/models/Transaction';
import { connectToDatabase } from '@/lib/mongodb';

export async function GET() {
  try {
    const session = await getServerSession();
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectToDatabase();
    const transactions = await Transaction.find({ 
      userId: session.user.id 
    }).sort({ date: -1 });

    return NextResponse.json(transactions);
  } catch (error) {
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession();
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const data = await req.json();
    await connectToDatabase();

    const transaction = new Transaction({
      ...data,
      userId: session.user.id,
    });

    await transaction.save();
    return NextResponse.json(transaction);
  } catch (error) {
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
} 