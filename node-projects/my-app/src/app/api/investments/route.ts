import { NextResponse } from 'next/server';

const CRYPTO_API = 'https://api.binance.com/api/v3';
const CRYPTO_FALLBACK = 'https://api.coingecko.com/v3';
const STOCK_API = 'https://query1.finance.yahoo.com/v8/finance/chart';
const METAL_API = 'https://query1.finance.yahoo.com/v8/finance/chart';

async function fetchMetalPrice(symbol: string) {
  try {
    let yahooSymbol = symbol;
    if (symbol === 'XAU') yahooSymbol = 'GC=F';
    if (symbol === 'XPT') yahooSymbol = 'PL=F';
    const res = await fetch(`${METAL_API}/${yahooSymbol}?interval=1d&range=1d`, {
      headers: { 'User-Agent': 'Mozilla/5.0' }
    });
    const data = await res.json();
    const result = data?.chart?.result?.[0];
    if (!result) return null;
    const price = result.meta?.regularMarketPrice || 0;
    const prevClose = result.meta?.previousClose || price;
    const change = prevClose > 0 ? ((price - prevClose) / prevClose) * 100 : 0;
    return { price, change };
  } catch { return null; }
}

async function fetchCryptoPrice(symbol: string) {
  const cryptoMap: Record<string, string> = {
    BTC: 'bitcoin', ETH: 'ethereum', LTC: 'litecoin', XRP: 'ripple',
    SOL: 'solana', FIL: 'filecoin', DOGE: 'dogecoin', ADA: 'cardano', XTZ: 'tezos'
  };
  
  // Try Binance
  try {
    const priceRes = await fetch(`${CRYPTO_API}/ticker/price?symbol=${symbol}USDT`, { signal: AbortSignal.timeout(3000) });
    const priceData = await priceRes.json();
    if (priceData.price) {
      return { price: parseFloat(priceData.price), change: 0 };
    }
  } catch {}
  
  // Fallback: CoinGecko
  const geckoId = cryptoMap[symbol];
  if (geckoId) {
    try {
      const geckoRes = await fetch(`${CRYPTO_FALLBACK}/simple/price?ids=${geckoId}&vs_currencies=usd`, { signal: AbortSignal.timeout(3000) });
      const geckoData = await geckoRes.json();
      if (geckoData[geckoId]?.usd) {
        return { price: geckoData[geckoId].usd, change: 0 };
      }
    } catch {}
  }
  
  return { price: 0, change: 0 };
}

async function fetchStockPrice(symbol: string) {
  try {
    const res = await fetch(`${STOCK_API}/${symbol}?interval=1d&range=1d`, {
      headers: { 'User-Agent': 'Mozilla/5.0' }
    });
    const data = await res.json();
    const result = data?.chart?.result?.[0];
    if (!result) return null;
    const price = result.meta?.regularMarketPrice || 0;
    const prevClose = result.meta?.previousClose || price;
    const change = prevClose > 0 ? ((price - prevClose) / prevClose) * 100 : 0;
    return { price, change };
  } catch { return null; }
}

export async function GET() {
  const symbols = [
    { symbol: 'BTC', type: 'crypto' },
    { symbol: 'ETH', type: 'crypto' },
    { symbol: 'LTC', type: 'crypto' },
    { symbol: 'XRP', type: 'crypto' },
    { symbol: 'SOL', type: 'crypto' },
    { symbol: 'FIL', type: 'crypto' },
    { symbol: 'DOGE', type: 'crypto' },
    { symbol: 'ADA', type: 'crypto' },
    { symbol: 'XTZ', type: 'crypto' },
    { symbol: 'AAPL', type: 'stock' },
    { symbol: 'META', type: 'stock' },
    { symbol: 'TTWO', type: 'stock' },
    { symbol: 'XPEV', type: 'stock' },
    { symbol: 'EGL', type: 'stock', yahooSymbol: 'EGL.LS' },
    { symbol: 'KVUE', type: 'stock' },
    { symbol: 'EXOD', type: 'stock' },
    { symbol: 'DIB', type: 'stock', yahooSymbol: 'DIB.MI' },
    { symbol: 'XBOTF', type: 'stock', yahooSymbol: 'XBOTF' },
    { symbol: 'SP500', type: 'index', yahooSymbol: '%5EGSPC' },
  ];

  const metals = [
    { symbol: 'XAU', type: 'metal', yahooSymbol: 'GC%3DF' },
    { symbol: 'XPT', type: 'metal', yahooSymbol: 'PL%3DF' },
  ];

  const results = await Promise.all(
    symbols.map(async ({ symbol, type, yahooSymbol }) => {
      const data = type === 'crypto' ? await fetchCryptoPrice(symbol) : await fetchStockPrice(yahooSymbol || symbol);
      return { symbol, type, ...data };
    })
  );

  const metalResults = await Promise.all(
    metals.map(async ({ symbol, yahooSymbol }) => {
      const data = await fetchMetalPrice(yahooSymbol);
      return { symbol, type: 'metal', ...data };
    })
  );

  return NextResponse.json([...results, ...metalResults]);
}