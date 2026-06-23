import { NextResponse } from 'next/server';

const CRYPTO_API = 'https://api.binance.com/api/v3';
const COINGECKO_API = 'https://api.coingecko.com/api/v3';
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
  
  // Try CoinGecko first (more reliable from serverless)
  const geckoId = cryptoMap[symbol];
  if (geckoId) {
    try {
      const geckoRes = await fetch(`${COINGECKO_API}/simple/price?ids=${geckoId}&vs_currencies=usd`);
      const geckoData = await geckoRes.json();
      if (geckoData[geckoId]?.usd) {
        return { price: geckoData[geckoId].usd, change: 0 };
      }
    } catch {}
  }
  
  // Fallback: Binance
  try {
    const priceRes = await fetch(`${CRYPTO_API}/ticker/price?symbol=${symbol}USDT`);
    const priceData = await priceRes.json();
    if (priceData.price) {
      return { price: parseFloat(priceData.price), change: 0 };
    }
  } catch {}
  
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
    { symbol: 'DIB', type: 'stock', yahooSymbol: 'DIB.MI' },
    { symbol: 'KVU', type: 'stock', yahooSymbol: 'KVUE' },
    { symbol: 'EXO', type: 'stock', yahooSymbol: 'EXOD' },
    { symbol: 'EXOD', type: 'stock', yahooSymbol: 'EXOD' },
    { symbol: 'XBO', type: 'stock' },
    { symbol: 'MOTA', type: 'stock', yahooSymbol: 'MOTA.LS' },
    { symbol: 'XPEV', type: 'stock', yahooSymbol: 'XPEV' },
    { symbol: 'MSGM', type: 'stock', yahooSymbol: 'MSGM' },
    { symbol: 'NBIU', type: 'stock', yahooSymbol: 'IBB' },
    { symbol: 'IPRP', type: 'stock', yahooSymbol: 'IPE.L' },
    { symbol: 'EDPR', type: 'stock', yahooSymbol: '0RPM.L' },
    { symbol: 'TDG', type: 'stock', yahooSymbol: 'HMWD.L' },
    { symbol: 'XGAT', type: 'stock', yahooSymbol: 'XAUG.DE' },
    { symbol: 'SP500', type: 'index', yahooSymbol: '%5EGSPC' },
  ];

  const metals = [
    { symbol: 'XAU', type: 'metal', yahooSymbol: 'GC%3DF' },
    { symbol: 'XPT', type: 'metal', yahooSymbol: 'PL%3DF' },
  ];

  const FALLBACK_PRICES: Record<string, { price: number; change: number }> = {
    DIB: { price: 8.50, change: 0 },
    XBO: { price: 0.25, change: 0 },
    MOTA: { price: 4.10, change: 0 },
    MSGM: { price: 2.80, change: 0 },
    NBIU: { price: 5.91, change: 0 },
    IPRP: { price: 30.87, change: 0 },
    EDPR: { price: 14.22, change: 0 },
    TDG: { price: 42.35, change: 0 },
    XGAT: { price: 116.79, change: 0 },
  };

  const results = await Promise.all(
    symbols.map(async ({ symbol, type, yahooSymbol }) => {
      const data = type === 'crypto' ? await fetchCryptoPrice(symbol) : await fetchStockPrice(yahooSymbol || symbol);
      const fallback = FALLBACK_PRICES[symbol];
      if ((!data?.price || data.price === 0) && fallback) {
        return { symbol, type, ...fallback };
      }
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