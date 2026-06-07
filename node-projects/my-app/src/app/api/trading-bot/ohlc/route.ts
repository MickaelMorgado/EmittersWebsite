import { NextResponse } from 'next/server';

export interface OHLCBar {
  time: number;   // unix ms
  open: number;
  high: number;
  low: number;
  close: number;
  ma9:  number | null;
  ma21: number | null;
  ma50: number | null;
}

/** Simple Moving Average over an array of closes. */
function computeSMA(closes: number[], period: number): (number | null)[] {
  return closes.map((_, i) =>
    i < period - 1
      ? null
      : closes.slice(i - period + 1, i + 1).reduce((a, b) => a + b, 0) / period
  );
}

export async function GET(request: Request) {
  try {
    const url  = new URL(request.url);
    const limit = Math.min(200, parseInt(url.searchParams.get('limit') || '80'));

    // Fetch from Binance (public, no auth)
    const binanceUrl =
      `https://api.binance.com/api/v3/klines?symbol=BTCUSDT&interval=1m&limit=${limit + 50}`; // extra bars so SMA has data from bar 0

    const res = await fetch(binanceUrl, {
      signal: AbortSignal.timeout(5000),
      headers: { 'Accept': 'application/json' },
    });

    if (!res.ok) {
      return NextResponse.json({ error: `Binance error: ${res.status}` }, { status: 502 });
    }

    const klines: any[][] = await res.json();

    const raw = klines.map(k => ({
      time:  k[0] as number,
      open:  parseFloat(k[1]),
      high:  parseFloat(k[2]),
      low:   parseFloat(k[3]),
      close: parseFloat(k[4]),
    }));

    const closes = raw.map(b => b.close);
    const sma9   = computeSMA(closes, 9);
    const sma21  = computeSMA(closes, 21);
    const sma50  = computeSMA(closes, 50);

    const bars: OHLCBar[] = raw.map((b, i) => ({
      ...b,
      ma9:  sma9[i],
      ma21: sma21[i],
      ma50: sma50[i],
    }));

    // Return only the last `limit` bars (warmup bars discarded)
    const result = bars.slice(-limit);

    return NextResponse.json({ bars: result, symbol: 'BTCUSDT', interval: '1m' });
  } catch (err) {
    console.error('[OHLC] Error:', err);
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
