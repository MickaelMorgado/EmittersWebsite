import { NextRequest, NextResponse } from 'next/server';

/**
 * GET /api/unlock?redirect=/pc-ai-assistant
 *
 * Sets the site_unlocked cookie (7-day) and redirects to the given path.
 * Only works from localhost — rejects any non-local origin.
 */
export async function GET(request: NextRequest) {
  const host = request.headers.get('host') || '';
  const isLocal = host.startsWith('localhost') || host.startsWith('127.0.0.1');

  if (!isLocal) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const { searchParams } = request.nextUrl;
  const redirect = searchParams.get('redirect') || '/';

  const expires = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toUTCString();
  const response = NextResponse.redirect(new URL(redirect, request.nextUrl.origin));
  response.cookies.set('site_unlocked', 'true', {
    path: '/',
    expires: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    sameSite: 'lax',
  });

  return response;
}
