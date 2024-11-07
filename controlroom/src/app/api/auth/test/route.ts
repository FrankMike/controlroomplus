import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  try {
    const headers = new Headers(request.headers);
    console.log('Test endpoint - Headers:', Object.fromEntries(headers));
    
    const response = await fetch('http://localhost:3000/api/auth/me', {
      headers,
      credentials: 'include',
    });
    
    if (!response.ok) {
      console.error('Auth test failed:', await response.text());
      return NextResponse.json({ error: 'Auth test failed' }, { status: 401 });
    }
    
    const userData = await response.json();
    console.log('Auth test - User data:', userData);
    
    return NextResponse.json({ 
      message: 'Auth test successful',
      user: userData 
    });
  } catch (error) {
    console.error('Auth test error:', error);
    return NextResponse.json({ error: 'Auth test error' }, { status: 500 });
  }
} 