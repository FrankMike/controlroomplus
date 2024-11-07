import { NextResponse } from 'next/server';
import { NextRequest } from 'next/server';

// Add routes that should be protected
const protectedRoutes = [
  '/dashboard',
  '/profile',
  '/api/protected-route',
  '/notes/:path*',
  '/diary/:path*',
  '/finance/:path*',
  '/media/:path*',
  // Add other protected routes
];

export function middleware(request: NextRequest) {
  const token = request.cookies.get('token');
  const { pathname } = request.nextUrl;

  // Check if the route should be protected
  const isProtectedRoute = protectedRoutes.some(route => 
    pathname.startsWith(route)
  );

  // Redirect to login if accessing protected route without token
  if (isProtectedRoute && !token) {
    const url = new URL('/login', request.url);
    url.searchParams.set('from', pathname);
    return NextResponse.redirect(url);
  }

  // Redirect to home if accessing auth pages while logged in
  if ((pathname === '/login' || pathname === '/register') && token) {
    return NextResponse.redirect(new URL('/', request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     */
    '/((?!_next/static|_next/image|favicon.ico|public/).*)',
  ],
}; 