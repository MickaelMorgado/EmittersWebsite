import { NextRequest, NextResponse } from 'next/server';

// List of routes that require the site to be unlocked
const PRIVATE_ROUTES = [
  '/PNLCalendar',
  '/memogpt',
  '/blockchain-visualizer',
  '/todo',
  '/HipsExample',
  '/pc-ai-assistant',
  '/tiktok-tts',
];

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Check if the current path is in the private routes list
  const isPrivateRoute = PRIVATE_ROUTES.some(route => pathname.startsWith(route));

  if (isPrivateRoute) {
    const isUnlocked = request.cookies.get('site_unlocked')?.value === 'true';

    if (!isUnlocked) {
      // Redirect to the home page if trying to access a private route while locked
      const url = request.nextUrl.clone();
      url.pathname = '/';
      return NextResponse.redirect(url);
    }
  }

  return NextResponse.next();
}

// See "Matching Paths" below to learn more
export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - assets (public assets)
     */
    '/((?!api|_next/static|_next/image|favicon.ico|assets).*)',
  ],
};
