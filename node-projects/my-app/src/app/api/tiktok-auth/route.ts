import { NextRequest, NextResponse } from 'next/server';

const TIKTOK_API_BASE = 'https://open.tiktokapis.com';
const DEFAULT_CLIENT_KEY = process.env.TIKTOK_CLIENT_KEY;
const DEFAULT_CLIENT_SECRET = process.env.TIKTOK_CLIENT_SECRET;

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { client_key = DEFAULT_CLIENT_KEY, client_secret = DEFAULT_CLIENT_SECRET, grant_type = 'authorization_code', authorization_code, refresh_token, code_verifier } = body;

    if (!client_key || !client_secret) {
      return NextResponse.json(
        { error: 'Missing client_key or client_secret' },
        { status: 400 }
      );
    }

    let tokenUrl = '';
    const params = new URLSearchParams({
      client_key,
      client_secret,
    });

    if (grant_type === 'authorization_code' && authorization_code) {
      tokenUrl = `${TIKTOK_API_BASE}/oauth/access_token/`;
      params.append('grant_type', 'authorization_code');
      params.append('authorization_code', authorization_code);
      if (code_verifier) {
        params.append('code_verifier', code_verifier);
      }
    } else if (grant_type === 'refresh_token' && refresh_token) {
      tokenUrl = `${TIKTOK_API_BASE}/oauth/refresh_token/`;
      params.append('grant_type', 'refresh_token');
      params.append('refresh_token', refresh_token);
    } else {
      return NextResponse.json(
        { error: 'Invalid grant_type or missing code/refresh_token' },
        { status: 400 }
      );
    }

    const response = await fetch(tokenUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: params.toString(),
    });

    const data = await response.json();

    if (data.error) {
      return NextResponse.json(
        { error: data.error },
        { status: response.status }
      );
    }

    return NextResponse.json({
      access_token: data.data?.access_token,
      refresh_token: data.data?.refresh_token,
      open_id: data.data?.open_id,
      expires_in: data.data?.expires_in,
    });
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to get access token' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const clientKey = searchParams.get('client_key') || DEFAULT_CLIENT_KEY;
  const redirectUri = searchParams.get('redirect_uri');
  const state = searchParams.get('state') || 'state';
  const codeChallenge = searchParams.get('code_challenge');

  if (!clientKey || !redirectUri) {
    return NextResponse.json(
      { error: 'Missing client_key or redirect_uri' },
      { status: 400 }
    );
  }

  let authUrl = `https://www.tiktok.com/v2/auth/authorize/?client_key=${clientKey}&response_type=code&redirect_uri=${encodeURIComponent(redirectUri)}&scope=user.info.basic,video.list&state=${state}`;
  
  if (codeChallenge) {
    authUrl += `&code_challenge=${codeChallenge}&code_challenge_method=S256`;
  }

  return NextResponse.redirect(authUrl);
}
