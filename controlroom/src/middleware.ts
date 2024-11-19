import { withAuth } from 'next-auth/middleware';
import { NextResponse } from 'next/server';

export default withAuth(
  function middleware(_req) {
    return NextResponse.next();
  },
  {
    callbacks: {
      authorized: ({ token }) => !!token
    },
    pages: {
      signIn: '/login',
    }
  }
);

export const config = {
  matcher: [
    '/diary/:path*',
    '/api/diary/:path*',
    '/finance/:path*',
    '/api/finance/:path*',
    '/api/transactions/:path*',
    '/media/:path*',
    '/api/movies/:path*',
    '/api/tvshows/:path*'
  ]
}; 