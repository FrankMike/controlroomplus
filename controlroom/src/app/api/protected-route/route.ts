import { NextResponse } from 'next/server';

export async function GET() {
  // This route is automatically protected by the middleware
  return NextResponse.json({ message: 'Protected data' });
} 