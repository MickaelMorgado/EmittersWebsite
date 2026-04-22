'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { TrendingDown, TrendingUp } from 'lucide-react';
import { useEffect, useState } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';

const AUTH_PASSWORD = 'mick123';

function AuthScreen({ onUnlock }: { onUnlock: () => void }) {
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (password === AUTH_PASSWORD) {
      localStorage.setItem('investments-token', password);
      onUnlock();
    } else {
      setError('Invalid password');
    }
  };

  return (
    <div className="min-h-screen bg-black text-white flex items-center justify-center p-4">
      <Card className="w-full max-w-md bg-zinc-900 border-zinc-800">
        <CardHeader>
          <CardTitle className="text-2xl font-bold text-center uppercase">Investments</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <Input
              type="password"
              placeholder="Enter password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="bg-zinc-800 border-zinc-700 text-white"
            />
            {error && <p className="text-red-500 text-sm">{error}</p>}
            <Button type="submit" className="w-full">
              Unlock
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}

interface Asset {
  symbol: string;
  name: string;
  price: number;
  change: number;
  bep: number;
  qty: number;
  currency: string;
  price24h: number;
}

const CRYPTO_API = 'https://api.binance.com/api/v3';

async function fetchCryptoPrice(symbol: string): Promise<{ price: number; change: number }> {
  try {
    const [priceRes, tickerRes] = await Promise.all([
      fetch(`${CRYPTO_API}/ticker/price?symbol=${symbol}USDT`),
      fetch(`${CRYPTO_API}/ticker/24hr?symbol=${symbol}USDT`)
    ]);
    const priceData = await priceRes.json();
    const tickerData = await tickerRes.json();
    return {
      price: parseFloat(priceData.price),
      change: parseFloat(tickerData.priceChangePercent)
    };
  } catch {
    return { price: 0, change: 0 };
  }
}

const CRYPTO_SYMBOLS = ['BTC', 'ETH', 'LTC', 'XRP', 'SOL', 'FIL', 'DOGE'];

function initCrypto(): Asset[] {
  return CRYPTO_SYMBOLS.map(symbol => ({
    symbol,
    name: getCryptoName(symbol),
    price: 0,
    change: 0,
    bep: getBEP(symbol),
    qty: 0,
    currency: 'USD',
    price24h: 0
  }));
}

function getCryptoName(symbol: string): string {
  const names: Record<string, string> = {
    BTC: 'Bitcoin', ETH: 'Ethereum', LTC: 'Litecoin', XRP: 'XRP',
    SOL: 'Solana', FIL: 'Filecoin', DOGE: 'Dogecoin'
  };
  return names[symbol] || symbol;
}

const STOCK_API = 'https://query1.finance.yahoo.com/v8/finance/chart';

async function fetchStockPrice(symbol: string): Promise<{ price: number; change: number }> {
  try {
    const res = await fetch(`${STOCK_API}/${symbol}?interval=1d&range=1d`, {
      headers: { 'User-Agent': 'Mozilla/5.0' }
    });
    const data = await res.json();
    const result = data?.chart?.result?.[0];
    if (!result) return { price: 0, change: 0 };
    
    const price = result.meta.regularMarketPrice || 0;
    const prevClose = result.meta.previousClose || price;
    const change = prevClose > 0 ? ((price - prevClose) / prevClose) * 100 : 0;
    return { price, change };
  } catch {
    return { price: 0, change: 0 };
  }
}

const STOCK_SYMBOLS = ['AAPL', 'META', 'TTWO', 'XPEV', 'EGL', 'KVUE'];

function getStockSymbol(symbol: string): string {
  if (symbol === '76M') return 'XBOTF';
  return getStockName(symbol);
}

function getStockName(symbol: string): string {
  const names: Record<string, string> = {
    AAPL: 'Apple', META: 'Meta', TTWO: 'Take-Two', XPEV: 'XPeng',
    EGL: 'Eastman', KVUE: 'Kenvue', DIB: 'iShares Clean Energy',
    MSGM: 'MGIC', EXOD: 'Exodus', XBOT: 'iShares Robotics',
    ADA: 'Cardano', XTZ: 'Tezos', BMW: 'BMW'
  };
  return names[symbol] || symbol;
}

const PORTFOLIO: Record<string, { bep: number; qty: number; currency: string }> = {
  XPEV: { bep: 18.78, qty: 2, currency: 'USD' },
  DIB: { bep: 11.39666, qty: 12, currency: 'EUR' },
  EXOD: { bep: 19.42975, qty: 20, currency: 'USD' },
  KVUE: { bep: 17.22, qty: 2, currency: 'USD' },
  EGL: { bep: 4.26, qty: 2, currency: 'EUR' },
  XBOTF: { bep: 0.254, qty: 70, currency: 'USD' },
  BTC: { bep: 105900, qty: 0, currency: 'USD' },
  SOL: { bep: 140, qty: 0, currency: 'USD' },
  BMW: { bep: 75, qty: 0, currency: 'EUR' },
  ADA: { bep: 0.45, qty: 0, currency: 'USD' },
  XTZ: { bep: 2.5, qty: 0, currency: 'USD' },
};

function getBEP(symbol: string): number {
  return PORTFOLIO[symbol]?.bep || 0;
}

function getQty(symbol: string): number {
  return PORTFOLIO[symbol]?.qty || 0;
}

function getCurrency(symbol: string): string {
  return PORTFOLIO[symbol]?.currency || 'USD';
}

function getInitialCrypto(): Asset[] {
  return CRYPTO_SYMBOLS.map(symbol => ({
    symbol,
    name: getCryptoName(symbol),
    price: 0,
    change: 0,
    bep: getBEP(symbol),
    qty: 0,
    currency: 'USD',
    price24h: 0
  }));
}

function getInitialStocks(): Asset[] {
  return [...STOCK_SYMBOLS, 'EXOD', 'DIB', 'XBOTF'].map(symbol => ({
    symbol,
    name: getStockSymbol(symbol),
    price: 0,
    change: 0,
    bep: getBEP(symbol),
    qty: getQty(symbol),
    currency: getCurrency(symbol),
    price24h: 0
  }));
}

function getInitialCommodities(): Asset[] {
  return [
    { symbol: 'XAU', name: 'Gold', price: 0, change: 0, bep: 0, qty: 0, currency: 'USD', price24h: 0 },
    { symbol: 'XPT', name: 'Platinum', price: 0, change: 0, bep: 0, qty: 0, currency: 'USD', price24h: 0 },
    { symbol: 'SP500', name: 'S&P 500', price: 0, change: 0, bep: 0, qty: 0, currency: 'USD', price24h: 0 },
  ];
}

function formatPrice(price: number) {
  if (price === 0) return <span className="text-zinc-500 text-sm">--</span>;
  if (price >= 1000) return price.toLocaleString('en-US', { maximumFractionDigits: 0 });
  if (price >= 1) return price.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  return price.toLocaleString('en-US', { minimumFractionDigits: 4, maximumFractionDigits: 4 });
}

function formatPnL(price: number, bep: number) {
  if (price === 0 || bep === 0) return <span className="text-zinc-500 text-xs">--</span>;
  
  const pnl = ((price - bep) / bep) * 100;
  const isProfit = pnl >= 0;
  
  return (
    <div className={`flex items-center text-xs font-medium ${isProfit ? 'text-green-500' : 'text-red-500'}`}>
      {isProfit ? <TrendingUp className="h-3 w-3 mr-1" /> : <TrendingDown className="h-3 w-3 mr-1" />}
      {pnl >= 0 ? '+' : ''}{pnl.toFixed(2)}%
    </div>
  );
}

function MiniChart({ data, color }: { data: number[]; color: string }) {
  if (!data || data.length < 2) return null;
  const min = Math.min(...data);
  const max = Math.max(...data);
  const range = max - min || 1;
  const points = data.map((v, i) => {
    const x = (i / (data.length - 1)) * 100;
    const y = 100 - ((v - min) / range) * 100;
    return `${x},${y}`;
  }).join(' ');
  
  return (
    <svg className="absolute inset-0 w-full h-full opacity-20 pointer-events-none" preserveAspectRatio="none">
      <polyline fill="none" stroke={color} strokeWidth="1.5" points={points} />
    </svg>
  );
}

function AssetCard({ asset, loading, sparkline = [] }: { asset: Asset; loading?: boolean; sparkline?: number[] }) {
  const { symbol, name, price, change, bep, qty, currency } = asset;
  const isPositive = change > 0;
  const isNeutral = change === 0;
  const hasPrice = price > 0;
  const hasPosition = qty > 0;
  const pnl = hasPrice && bep > 0 ? ((price - bep) / bep) * 100 : 0;
  const isProfit = pnl > 0;
  const hasPnlData = hasPrice && bep > 0;
  
  const gradientClass = hasPnlData 
    ? isProfit 
      ? 'bg-gradient-to-tl from-green-600/25 to-transparent' 
      : 'bg-gradient-to-tl from-red-600/25 to-transparent'
    : '';

  const link = getTradingViewLink(symbol, asset.currency);
  
  const lineColor = hasPnlData ? (isProfit ? '#22c55e' : '#ef4444') : '#71717a';

  return (
    <a href={link} target="_blank" rel="noopener noreferrer" className="block">
      <Card className={`relative overflow-hidden bg-zinc-900/50 border-zinc-800 hover:border-zinc-600 transition-all hover:scale-[1.02] ${gradientClass}`}>
        <MiniChart data={sparkline} color={lineColor} />
        <CardHeader className="pb-1 relative">
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg font-bold text-white">{symbol}</CardTitle>
            {hasPosition && <span className="text-xs bg-zinc-700 px-2 py-0.5 rounded">{qty}x</span>}
          </div>
          <p className="text-xs text-zinc-400">{name}</p>
        </CardHeader>
        <CardContent className="space-y-2 relative">
          <div className="flex items-end justify-between">
            <span className="text-xl font-semibold text-white">
              {loading && !hasPrice ? (
                <span className="text-zinc-500 text-sm animate-pulse">Loading...</span>
              ) : (
                formatPrice(price)
              )}
            </span>
            <div className={`flex items-center text-sm font-medium ${isNeutral ? 'text-zinc-400' : isPositive ? 'text-green-500' : 'text-red-500'}`}>
              {isNeutral ? (
                <span className="text-zinc-400">--</span>
              ) : (
                <>
                  {isPositive ? <TrendingUp className="h-4 w-4 mr-1" /> : <TrendingDown className="h-4 w-4 mr-1" />}
                  {Math.abs(change).toFixed(2)}%
                </>
              )}
            </div>
          </div>
          <div className="flex items-center justify-between pt-1 border-t border-zinc-800">
            <span className="text-xs text-zinc-500">BEP</span>
            <span className="text-xs text-zinc-400">{bep > 0 ? `${currency} ${formatPrice(bep)}` : '--'}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-xs text-zinc-500">P&L</span>
            {formatPnL(price, bep)}
          </div>
        </CardContent>
      </Card>
    </a>
  );
}

function getTradingViewLink(symbol: string, currency: string): string {
  const base = 'https://www.tradingview.com/chart/?symbol=';
  const pairs: Record<string, string> = {
    BTC: 'BINANCE:BTCUSDT',
    ETH: 'BINANCE:ETHUSDT',
    LTC: 'BINANCE:LTCUSDT',
    XRP: 'BINANCE:XRPUSDT',
    SOL: 'BINANCE:SOLUSDT',
    FIL: 'BINANCE:FILUSDT',
    DOGE: 'BINANCE:DOGEUSDT',
    ADA: 'BINANCE:ADAUSDT',
    XTZ: 'BINANCE:XTZUSDT',
    AAPL: 'NASDAQ:AAPL',
    META: 'NASDAQ:META',
    TTWO: 'NASDAQ:TTWO',
    XPEV: 'NASDAQ:XPEV',
    EGL: 'EURONEXT:EGL',
    KVUE: 'NYSE:KVUE',
    EXOD: 'NASDAQ:EXOD',
    DIB: 'MILAN:DIB',
    XBOTF: 'OTC:XBOTF',
    XAU: 'TVC:GOLD',
    XPT: 'TVC:PLATINUM',
    SP500: 'TVC:SPX',
  };
  return base + (pairs[symbol] || `NYSE:${symbol}`);
}

export default function InvestmentsPage() {
  const [unlocked, setUnlocked] = useState(false);
  const [cryptoData, setCryptoData] = useState<Asset[]>(getInitialCrypto());
  const [stockData, setStockData] = useState<Asset[]>(getInitialStocks());
  const [commodities, setCommodities] = useState<Asset[]>(getInitialCommodities());
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchAllPrices() {
      setLoading(true);
      
try {
        const res = await fetch('/api/investments');
        const data = await res.json();
        
        if (Array.isArray(data)) {
          const allResults = data.filter((d: any) => d && d.price > 0).map((d: any) => ({
            symbol: d.symbol,
            name: getCryptoName(d.symbol) || getStockSymbol(d.symbol),
            price: d.price,
            change: d.change,
            bep: getBEP(d.symbol),
            qty: getQty(d.symbol),
            currency: getCurrency(d.symbol),
            price24h: d.price
          }));
          
          const withAllocation = (a: any) => (getQty(a.symbol) || 0) * (getBEP(a.symbol) || 0);
          
          const cryptoResults = allResults.filter((a: any) => ['BTC','ETH','LTC','XRP','SOL','FIL','DOGE','ADA','XTZ'].includes(a.symbol));
          const stockResults = allResults.filter((a: any) => ['AAPL','META','TTWO','XPEV','EGL','KVUE','EXOD','DIB','XBOTF'].includes(a.symbol));
          const commodityResults = allResults.filter((a: any) => ['XAU','XPT','SP500'].includes(a.symbol));
          
          // Only update if we have data
          if (cryptoResults.length > 0) setCryptoData(cryptoResults.sort((a: any, b: any) => withAllocation(b) - withAllocation(a)));
          if (stockResults.length > 0) setStockData(stockResults.sort((a: any, b: any) => withAllocation(b) - withAllocation(a)));
          if (commodityResults.length > 0) setCommodities(commodityResults.sort((a: any, b: any) => withAllocation(b) - withAllocation(a)));
        }
      } catch (err) {
        console.error('Failed to fetch prices:', err);
      }
      setLoading(false);
    }

    fetchAllPrices();
    const interval = setInterval(fetchAllPrices, 30000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const token = localStorage.getItem('investments-token');
    if (token === AUTH_PASSWORD) setUnlocked(true);
  }, []);

  if (!unlocked) {
    return <AuthScreen onUnlock={() => setUnlocked(true)} />;
  }

  return (
    <div className="min-h-screen bg-black text-white p-4 lg:p-8">
      <div className="container mx-auto">
        <h1 className="text-4xl font-bold tracking-tight mb-2 heading-shine uppercase">Investments Dashboard</h1>
        <p className="text-zinc-400 mb-8">Track your stocks, crypto, and market indices</p>

        {/* Crypto */}
        <section className="mb-8">
          <h2 className="text-2xl font-bold mb-4 text-zinc-300">Crypto</h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-7 gap-4">
            {cryptoData.map((asset) => (
              <AssetCard key={asset.symbol} asset={asset} loading={loading} />
            ))}
          </div>
        </section>

        {/* Metals & Commodities */}
        <section className="mb-8">
          <h2 className="text-2xl font-bold mb-4 text-zinc-300">Metals & Commodities</h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
            {commodities.map((asset) => (
              <AssetCard key={asset.symbol} asset={asset} />
            ))}
          </div>
        </section>

        {/* Stocks */}
        <section>
          <h2 className="text-2xl font-bold mb-4 text-zinc-300">Stocks</h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-7 gap-4">
            {stockData.map((asset) => (
              <AssetCard key={asset.symbol} asset={asset} loading={loading} />
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}