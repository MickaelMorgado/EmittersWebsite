'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { TrendingDown, TrendingUp, Eye, EyeOff, RefreshCw } from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import InvestmentsSidebar from '@/app/investments/components/InvestmentsSidebar';
import {
  Entry,
  fetchAllEntries,
  getBEPFromEntries,
  getCurrency,
} from '@/app/investments/data';

const AUTH_PASSWORD = process.env.NEXT_PUBLIC_AUTH_PASSWORD;

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

interface SelectedAsset {
  symbol: string;
  name: string;
  price: number;
  change: number;
  currency: string;
  entries: Entry[];
  bep: number;
}

function getCryptoName(symbol: string): string {
  const names: Record<string, string> = {
    BTC: 'Bitcoin', ETH: 'Ethereum', LTC: 'Litecoin', XRP: 'XRP',
    SOL: 'Solana', FIL: 'Filecoin', DOGE: 'Dogecoin'
  };
  return names[symbol] || symbol;
}

function getStockName(symbol: string): string {
  const names: Record<string, string> = {
    DIB: 'Digital Bros', KVU: 'Kenvue', EXO: 'Exodus', EXOD: 'Exodus', XBO: 'Realbotix',
    MOTA: 'Mota Engil', XPEV: 'XPeng', MSGM: 'Motorsport Games', NBIU: 'Biotech ETF',
    IPRP: 'EU Property ETF', EDPR: 'EDP Renewals', TDG: 'MSCI World ETF', XGAT: 'Xetra-Gold', BTC: 'Bitcoin', ETH: 'Ethereum', LTC: 'Litecoin',
    XRP: 'XRP', SOL: 'Solana', FIL: 'Filecoin', DOGE: 'Dogecoin',
    ADA: 'Cardano', XTZ: 'Tezos'
  };
  return names[symbol] || symbol;
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

function AssetCard({ asset, loading, sparkline = [], onClick, blurValues = false, compact = false }: { asset: Asset; loading?: boolean; sparkline?: number[]; onClick?: () => void; blurValues?: boolean; compact?: boolean }) {
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

  const lineColor = hasPnlData ? (isProfit ? '#22c55e' : '#ef4444') : '#71717a';

  if (compact) {
    return (
      <button onClick={onClick} className="block w-full text-left">
        <Card className={`relative overflow-hidden bg-zinc-900/50 border-zinc-800 hover:border-zinc-600 transition-all py-2 px-3 ${gradientClass}`}>
          <MiniChart data={sparkline} color={lineColor} />
          <div className="flex items-center justify-between relative">
            <div>
              <CardTitle className="text-sm font-bold text-white">{symbol}</CardTitle>
              <p className="text-[10px] text-zinc-400 truncate max-w-[80px]">{name}</p>
            </div>
            <div className="text-right">
              <span className="text-sm font-semibold text-white">
                {loading && !hasPrice ? <span className="text-zinc-500 text-xs animate-pulse">...</span> : formatPrice(price)}
              </span>
              <div className={`flex items-center text-[10px] font-medium ${isNeutral ? 'text-zinc-400' : isPositive ? 'text-green-500' : 'text-red-500'}`}>
                {isNeutral ? '--' : `${isPositive ? '+' : ''}${Math.abs(change).toFixed(1)}%`}
              </div>
            </div>
          </div>
        </Card>
      </button>
    );
  }

  return (
    <button onClick={onClick} className="block w-full text-left">
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
              {loading && !hasPrice ? <span className="text-zinc-500 text-sm animate-pulse">Loading...</span> : formatPrice(price)}
            </span>
            <div className={`flex items-center text-sm font-medium ${isNeutral ? 'text-zinc-400' : isPositive ? 'text-green-500' : 'text-red-500'}`}>
              {isNeutral ? <span className="text-zinc-400">--</span> : <>{isPositive ? <TrendingUp className="h-4 w-4 mr-1" /> : <TrendingDown className="h-4 w-4 mr-1" />}{Math.abs(change).toFixed(2)}%</>}
            </div>
          </div>
          <div className="flex items-center justify-between pt-1 border-t border-zinc-800">
            <span className="text-xs text-zinc-500">{blurValues ? 'Pos' : 'BEP'}</span>
            <span className={`text-xs text-zinc-400 ${blurValues ? 'blur-sm select-none' : ''}`}>
              {bep > 0 ? (blurValues ? '••••' : `${currency} ${formatPrice(bep)}`) : '--'}
            </span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-xs text-zinc-500">P&L</span>
            {formatPnL(price, bep)}
          </div>
        </CardContent>
      </Card>
    </button>
  );
}

export default function InvestmentsPage() {
  const [unlocked, setUnlocked] = useState(false);
  const [cryptoData, setCryptoData] = useState<Asset[]>([]);
  const [stockData, setStockData] = useState<Asset[]>([]);
  const [commodities, setCommodities] = useState<Asset[]>([]);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [selectedAsset, setSelectedAsset] = useState<SelectedAsset | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [blurValues, setBlurValues] = useState(false);
  const [entriesMap, setEntriesMap] = useState<Record<string, Entry[]>>({});

  const loadEntries = useCallback(async () => {
    const all = await fetchAllEntries();
    setEntriesMap(all);
    return all;
  }, []);

  const handleAssetClick = (asset: Asset) => {
    const entries = entriesMap[asset.symbol] || [];
    const bep = getBEPFromEntries(entries);
    setSelectedAsset({
      symbol: asset.symbol,
      name: asset.name,
      price: asset.price,
      change: asset.change,
      currency: getCurrency(asset.symbol, entries),
      entries,
      bep,
    });
    setSidebarOpen(true);
  };

  const handleCloseSidebar = () => {
    setSidebarOpen(false);
    setSelectedAsset(null);
  };

  const handleEntriesChange = useCallback(async () => {
    const updated = await loadEntries();
    if (selectedAsset) {
      const entries = updated[selectedAsset.symbol] || [];
      const bep = getBEPFromEntries(entries);
      setSelectedAsset(prev => prev ? { ...prev, entries, bep } : null);
    }
  }, [loadEntries, selectedAsset]);

  const fetchAllPrices = useCallback(async (entries: Record<string, Entry[]>) => {
    try {
      const res = await fetch('/api/investments');
      const data = await res.json();
      
      if (Array.isArray(data)) {
        const allResults = data.filter((d: any) => d && d.price > 0).map((d: any) => {
          const symEntries = entries[d.symbol] || [];
          return {
            symbol: d.symbol,
            name: getCryptoName(d.symbol) || getStockName(d.symbol),
            price: d.price,
            change: d.change,
            bep: getBEPFromEntries(symEntries),
            qty: symEntries.reduce((sum: number, e: Entry) => sum + e.qty, 0),
            currency: getCurrency(d.symbol, symEntries),
            price24h: d.price
          };
        });
        
        const withAllocation = (a: any) => (a.qty || 0) * (a.bep || 0);
        
        const cryptoResults = allResults.filter((a: any) => ['BTC','ETH','LTC','XRP','SOL','FIL','DOGE','ADA','XTZ'].includes(a.symbol));
        const stockResults = allResults.filter((a: any) => ['DIB','KVU','EXO','EXOD','XBO','MOTA','XPEV','MSGM','NBIU','IPRP','EDPR','TDG','XGAT'].includes(a.symbol));
        const commodityResults = allResults.filter((a: any) => ['XAU','XPT','SP500'].includes(a.symbol));
        
        if (cryptoResults.length > 0) setCryptoData(cryptoResults.sort((a: any, b: any) => withAllocation(b) - withAllocation(a)));
        if (stockResults.length > 0) setStockData(stockResults.sort((a: any, b: any) => withAllocation(b) - withAllocation(a)));
        if (commodityResults.length > 0) setCommodities(commodityResults.sort((a: any, b: any) => withAllocation(b) - withAllocation(a)));
      }
    } catch (err) {
      console.error('Failed to fetch prices:', err);
    }
  }, []);

  const handleSync = async () => {
    setSyncing(true);
    const entries = await loadEntries();
    await fetchAllPrices(entries);
    setSyncing(false);
  };

  useEffect(() => {
    async function init() {
      setLoading(true);
      const entries = await loadEntries();
      setLoading(false);
      await fetchAllPrices(entries);
    }

    init();
  }, [loadEntries, fetchAllPrices]);

  useEffect(() => {
    const token = localStorage.getItem('investments-token');
    if (token === AUTH_PASSWORD) setUnlocked(true);
  }, []);

  if (!unlocked) {
    return <AuthScreen onUnlock={() => setUnlocked(true)} />;
  }

  return (
    <div className="min-h-screen bg-black text-white p-3 lg:p-4">
      <div className="flex items-center justify-between mb-2">
        <h1 className="text-xl font-bold tracking-tight heading-shine uppercase">Investments</h1>
        <div className="flex items-center gap-2">
          <button
            onClick={handleSync}
            disabled={syncing}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-400 hover:text-white transition-colors disabled:opacity-50"
            title="Sync prices"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${syncing ? 'animate-spin' : ''}`} />
            <span className="text-xs">{syncing ? 'Syncing...' : 'Sync'}</span>
          </button>
          <button
            onClick={() => setBlurValues(!blurValues)}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-400 hover:text-white transition-colors"
            title={blurValues ? 'Show values' : 'Hide values'}
          >
            {blurValues ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
            <span className="text-xs">{blurValues ? 'Show' : 'Hide'}</span>
          </button>
        </div>
      </div>

      <div className="flex gap-3 h-[calc(100vh-60px)]">
          <div className={`flex-1 transition-all duration-300 overflow-y-auto pr-2 ${selectedAsset ? 'w-[40%]' : 'w-full'}`}>
            {/* Crypto */}
            <section className="mb-8">
              <h2 className="text-2xl font-bold mb-4 text-zinc-300">Crypto</h2>
              <div className={`grid gap-2 ${selectedAsset ? 'grid-cols-1' : 'grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-8'}`}>
                {cryptoData.map((asset) => (
                  <AssetCard key={asset.symbol} asset={asset} loading={loading} onClick={() => handleAssetClick(asset)} blurValues={blurValues} compact={!!selectedAsset} />
                ))}
              </div>
            </section>

            {/* Stocks */}
            <section className="mb-8">
              <h2 className={`font-bold mb-3 text-zinc-300 ${selectedAsset ? 'text-lg' : 'text-2xl mb-4'}`}>Stocks</h2>
              <div className={`grid gap-2 ${selectedAsset ? 'grid-cols-1' : 'grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-8'}`}>
                {stockData.map((asset) => (
                  <AssetCard key={asset.symbol} asset={asset} loading={loading} onClick={() => handleAssetClick(asset)} blurValues={blurValues} compact={!!selectedAsset} />
                ))}
              </div>
            </section>

            {/* Metals & Commodities */}
            <section className="mb-8">
              <h2 className={`font-bold mb-3 text-zinc-300 ${selectedAsset ? 'text-lg' : 'text-2xl mb-4'}`}>Metals & Commodities</h2>
              <div className={`grid gap-2 ${selectedAsset ? 'grid-cols-1' : 'grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6'}`}>
                {commodities.map((asset) => (
                  <AssetCard key={asset.symbol} asset={asset} onClick={() => handleAssetClick(asset)} blurValues={blurValues} compact={!!selectedAsset} loading={loading} />
                ))}
              </div>
            </section>
          </div>
          {selectedAsset && (
            <InvestmentsSidebar
              key={`${selectedAsset.symbol}-${entriesMap[selectedAsset.symbol]?.length}`}
              symbol={selectedAsset.symbol}
              name={selectedAsset.name}
              currentPrice={selectedAsset.price}
              change24h={selectedAsset.change}
              entries={selectedAsset.entries}
              bep={selectedAsset.bep}
              currency={selectedAsset.currency}
              isOpen={sidebarOpen}
              onClose={handleCloseSidebar}
              onEntriesChange={handleEntriesChange}
              blurValues={blurValues}
            />
          )}
        </div>
    </div>
  );
}
