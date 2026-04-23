import { NextRequest, NextResponse } from 'next/server';

const CRYPTO_API = 'https://api.binance.com/api/v3';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const symbol = searchParams.get('symbol') || '';
  
  if (!symbol) {
    return NextResponse.json({ prices: [] });
  }

  try {
    const res = await fetch(`${CRYPTO_API}/klines?symbol=${symbol}USDT&interval=1d&limit=30`);
    const data = await res.json();
    const prices = data.map((k: any) => parseFloat(k[4])); // Close prices
    
    return NextResponse.json({ prices });
  } catch {
    return NextResponse.json({ prices: [] });
  }
}