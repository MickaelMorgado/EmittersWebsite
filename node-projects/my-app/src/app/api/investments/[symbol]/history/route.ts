import { NextRequest, NextResponse } from 'next/server';

const CRYPTO_SYMBOLS = ['BTC', 'ETH', 'LTC', 'XRP', 'SOL', 'FIL', 'DOGE', 'ADA', 'XTZ'];
const STOCK_SYMBOLS = ['DIB', 'KVU', 'EXO', 'XBO', 'MOTA', 'AAPL', 'META', 'TTWO', 'XPEV', 'EGL', 'KVUE', 'EXOD', 'XBOTF'];
const METAL_SYMBOLS = ['XAU', 'XPT'];

const YAHOO_STOCK_MAP: Record<string, string> = {
  EGL: 'EGL.LS',
  DIB: 'DIB.MI',
  XBOTF: 'XBOTF',
  KVU: 'KVUE',
  EXO: 'EXOD',
  MOTA: 'MOTA.LS',
};

const YAHOO_METAL_MAP: Record<string, string> = {
  XAU: 'GC=F',
  XPT: 'PL=F',
};

async function fetchBinanceHistory(symbol: string, limit: number) {
  try {
    const url = `https://api.binance.com/api/v3/klines?symbol=${symbol}USDT&interval=1d&limit=${limit}`;
    const res = await fetch(url, { headers: { 'User-Agent': 'Mozilla/5.0' } });
    const data = await res.json();
    
    if (!Array.isArray(data) || data.length === 0) return [];
    
    return data.map((kline: unknown[]) => ({
      date: new Date(kline[0] as number).toISOString().split('T')[0],
      price: parseFloat(kline[4] as string),
    }));
  } catch {
    return [];
  }
}

const YAHOO_CRYPTO_MAP: Record<string, string> = {
  BTC: 'BTC-USD', ETH: 'ETH-USD', LTC: 'LTC-USD', XRP: 'XRP-USD',
  SOL: 'SOL-USD', FIL: 'FIL-USD', DOGE: 'DOGE-USD', ADA: 'ADA-USD', XTZ: 'XTZ-USD',
};

async function fetchYahooCryptoHistory(symbol: string, range: number) {
  try {
    const yahooSymbol = YAHOO_CRYPTO_MAP[symbol] || `${symbol}-USD`;
    const url = `https://query1.finance.yahoo.com/v8/finance/chart/${yahooSymbol}?range=${range}d&interval=1d`;
    const res = await fetch(url, { headers: { 'User-Agent': 'Mozilla/5.0' } });
    const data = await res.json();
    const result = data?.chart?.result?.[0];
    if (!result) return [];
    const timestamps = result.timestamp as number[];
    const closes = result.indicators?.quote?.[0]?.close as number[];
    if (!timestamps || !closes) return [];
    return timestamps.map((ts, i) => ({
      date: new Date(ts * 1000).toISOString().split('T')[0],
      price: closes[i] ?? 0,
    }));
  } catch {
    return [];
  }
}

async function fetchYahooHistory(symbol: string, range: number) {
  try {
    let yahooSymbol = symbol;
    if (YAHOO_STOCK_MAP[symbol]) yahooSymbol = YAHOO_STOCK_MAP[symbol];
    if (YAHOO_METAL_MAP[symbol]) yahooSymbol = YAHOO_METAL_MAP[symbol];
    
    const url = `https://query1.finance.yahoo.com/v8/finance/chart/${yahooSymbol}?range=${range}d&interval=1d`;
    const res = await fetch(url, { headers: { 'User-Agent': 'Mozilla/5.0' } });
    const data = await res.json();
    
    const result = data?.chart?.result?.[0];
    if (!result) return [];
    
    const timestamps = result.timestamp as number[];
    const closes = result.indicators?.quote?.[0]?.close as number[];
    
    if (!timestamps || !closes) return [];
    
    return timestamps.map((ts, i) => ({
      date: new Date(ts * 1000).toISOString().split('T')[0],
      price: closes[i] ?? 0,
    }));
  } catch {
    return [];
  }
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ symbol: string }> }
) {
  const { symbol } = await params;
  const { searchParams } = new URL(request.url);
  const range = parseInt(searchParams.get('range') || '30', 10);
  const limit = Math.max(range, 1);

  let data: { date: string; price: number }[] = [];

  if (CRYPTO_SYMBOLS.includes(symbol.toUpperCase())) {
    data = await fetchBinanceHistory(symbol.toUpperCase(), Math.min(limit, 1000));
    if (!data.length) {
      data = await fetchYahooCryptoHistory(symbol.toUpperCase(), limit);
    }
  } else if (METAL_SYMBOLS.includes(symbol.toUpperCase())) {
    data = await fetchYahooHistory(symbol.toUpperCase(), limit);
  } else if (STOCK_SYMBOLS.includes(symbol.toUpperCase()) || YAHOO_STOCK_MAP[symbol.toUpperCase()]) {
    data = await fetchYahooHistory(symbol.toUpperCase(), limit);
  }

  return NextResponse.json(data, {
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    },
  });
}

export async function OPTIONS() {
  return new NextResponse(null, {
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    },
  });
}