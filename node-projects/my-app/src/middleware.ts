import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  // Only protect /investments routes
  if (request.nextUrl.pathname.startsWith('/investments')) {
    // Check for a secret token in the header or cookie
    const authToken = request.headers.get('x-investments-token') || request.cookies.get('investments-token');
    const validToken = process.env.INVESTMENTS_TOKEN;
    
    // Allow if token matches or in development
    if (!validToken || authToken === validToken || process.env.NODE_ENV === 'development') {
      return NextResponse.next();
    }
    
    // Redirect unauthenticated users to home
    return NextResponse.redirect(new URL('/', request.url));
  }
  
  return NextResponse.next();
}

export const config = {
  matcher: '/investments/:path*',
};