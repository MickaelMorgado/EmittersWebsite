'use client';

import { Eye, EyeOff, TrendingDown, TrendingUp, X } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import {
  Area,
  AreaChart,
  Line,
  ReferenceDot,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';

interface Entry {
  date: string;
  qty: number;
  price: number;
  chartDate?: string;
  chartPrice?: number;
}

interface SidebarProps {
  symbol: string;
  name: string;
  currentPrice: number;
  change24h: number;
  entries: Entry[];
  bep: number;
  currency: string;
  isOpen: boolean;
  onClose: () => void;
}

function generatePriceHistory(entries: Entry[], currentPrice: number, days = 90) {
  const now = new Date();
  const data: { date: string; price: number }[] = [];
  const startPrice = entries.length > 0 ? entries[0].price : currentPrice * 0.8;

  for (let i = days; i >= 0; i--) {
    const d = new Date(now);
    d.setDate(d.getDate() - i);
    const progress = (days - i) / days;
    const noise = (Math.random() - 0.5) * currentPrice * 0.05;
    const price = startPrice + (currentPrice - startPrice) * progress + noise;
    data.push({
      date: d.toISOString().split('T')[0],
      price: Math.max(0, parseFloat(price.toFixed(2))),
    });
  }
  return data;
}

function EntryTooltipContent({ entry, currency }: { entry: Entry; currency: string }) {
  return (
    <div className="bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-xs shadow-xl">
      <p className="text-zinc-400">{entry.date}</p>
      <p className="text-white font-medium">
        QTY: {entry.qty} @ {currency} {entry.price.toFixed(2)}
      </p>
      <p className="text-zinc-300">
        Value: {currency} {(entry.qty * entry.price).toFixed(2)}
      </p>
    </div>
  );
}

function CustomTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-xs shadow-xl">
      <p className="text-zinc-400">{label}</p>
      <p className="text-white font-medium">{payload[0].value?.toFixed(2)}</p>
    </div>
  );
}

export default function InvestmentsSidebar({
  symbol,
  name,
  currentPrice,
  change24h,
  entries,
  bep,
  currency,
  isOpen,
  onClose,
}: SidebarProps) {
  const [priceHistory, setPriceHistory] = useState<{ date: string; price: number }[]>([]);
  const [hoveredEntry, setHoveredEntry] = useState<Entry | null>(null);
  const [showBepLabel, setShowBepLabel] = useState(false);
  const [timeRange, setTimeRange] = useState<30 | 90 | 180 | 365 | 730>(90);
  const [blurValues, setBlurValues] = useState(false);

  const isPositive = change24h >= 0;
  const priceAboveBep = currentPrice >= bep;

  useEffect(() => {
    if (isOpen) {
      async function fetchHistory() {
        try {
          const res = await fetch(`/api/investments/${symbol}/history?range=${timeRange}`);
          const data = await res.json();
          if (Array.isArray(data) && data.length > 0) {
            setPriceHistory(data);
          } else {
            setPriceHistory(generatePriceHistory(entries, currentPrice, timeRange));
          }
        } catch {
          setPriceHistory(generatePriceHistory(entries, currentPrice, timeRange));
        }
      }
      fetchHistory();
    }
  }, [isOpen, entries, currentPrice, symbol, timeRange]);

  const entryPoints = useMemo(() => {
    return entries.map((entry) => {
      const entryDate = new Date(entry.date);
      let closestPoint = priceHistory[0];
      let minDiff = Infinity;

      priceHistory.forEach((p) => {
        const pDate = new Date(p.date);
        const diff = Math.abs(pDate.getTime() - entryDate.getTime());
        if (diff < minDiff) {
          minDiff = diff;
          closestPoint = p;
        }
      });

      return {
        ...entry,
        chartDate: closestPoint?.date,
        chartPrice: closestPoint?.price || entry.price,
      };
    });
  }, [entries, priceHistory]);

  const monthLines = useMemo(() => {
    const months: string[] = [];
    const seen = new Set<string>();
    priceHistory.forEach((p) => {
      const d = new Date(p.date);
      const monthKey = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      if (!seen.has(monthKey)) {
        seen.add(monthKey);
        months.push(p.date);
      }
    });
    return months;
  }, [priceHistory]);

  const trendline = useMemo(() => {
    if (priceHistory.length < 2) return [];
    const n = priceHistory.length;
    const sumX = (n * (n - 1)) / 2;
    const sumY = priceHistory.reduce((sum, p) => sum + p.price, 0);
    const sumXY = priceHistory.reduce((sum, p, i) => sum + i * p.price, 0);
    const sumX2 = (n * (n - 1) * (2 * n - 1)) / 6;
    const slope = (n * sumXY - sumX * sumY) / (n * sumX2 - sumX * sumX);
    const intercept = (sumY - slope * sumX) / n;
    return priceHistory.map((p, i) => ({
      ...p,
      trend: slope * i + intercept,
    }));
  }, [priceHistory]);

  if (!isOpen) return null;

  return (
    <div className="w-[60%] h-full bg-zinc-900 border-l border-zinc-800 overflow-y-auto flex-shrink-0 custom-scrollbar">
      {/* Header */}
      <div className="flex items-center justify-between p-5 border-b border-zinc-800">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-lg font-bold text-white">{symbol}</h2>
            <span className="text-sm text-zinc-400">{name}</span>
          </div>
          <div className="flex items-center gap-2 mt-1">
            <span className="text-xl font-semibold text-white">
              {currency} {currentPrice.toFixed(2)}
            </span>
            <span className={`flex items-center gap-0.5 text-sm font-medium ${isPositive ? 'text-emerald-400' : 'text-red-400'}`}>
              {isPositive ? <TrendingUp className="w-3.5 h-3.5" /> : <TrendingDown className="w-3.5 h-3.5" />}
              {isPositive ? '+' : ''}{change24h.toFixed(2)}%
            </span>
            <span className={`text-xs text-zinc-500 ml-2 ${blurValues ? 'blur-sm select-none' : ''}`}>
              BEP: {blurValues ? '••••' : `${currency} ${bep.toFixed(2)}`}
            </span>
          </div>
        </div>
        <div className="flex items-center">
          <button 
            onClick={(e) => { e.preventDefault(); e.stopPropagation(); setBlurValues(!blurValues); }}
            className="p-2 rounded-lg hover:bg-zinc-800 text-zinc-400 hover:text-white transition-colors mr-2"
            title={blurValues ? 'Show values' : 'Hide values'}
          >
            {blurValues ? <Eye className="w-5 h-5" /> : <EyeOff className="w-5 h-5" />}
          </button>
          <button onClick={onClose} className="p-2 rounded-lg hover:bg-zinc-800 text-zinc-400 hover:text-white transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Chart */}
      <div className="p-5">
        <h3 className="text-sm font-medium text-zinc-400 mb-3">Price History</h3>
        <div className="flex gap-1 mb-3">
          {[
            { value: 30, label: '1M' },
            { value: 90, label: '3M' },
            { value: 180, label: '6M' },
            { value: 365, label: '1Y' },
            { value: 730, label: '2Y' },
          ].map((range) => (
            <button
              key={range.value}
              onClick={() => setTimeRange(range.value as 30 | 90 | 180 | 365 | 730)}
              className={`px-3 py-1 text-xs rounded-full transition-colors ${
                timeRange === range.value ? 'bg-emerald-600 text-white' : 'bg-zinc-800 text-zinc-400 hover:text-white'
              }`}
            >
              {range.label}
            </button>
          ))}
        </div>
        <div className="h-96 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={trendline} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id="priceGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={priceAboveBep ? '#10b981' : '#ef4444'} stopOpacity={0.3} />
                  <stop offset="100%" stopColor={priceAboveBep ? '#10b981' : '#ef4444'} stopOpacity={0} />
                </linearGradient>
              </defs>
              <XAxis dataKey="date" tick={{ fill: '#71717a', fontSize: 10 }} axisLine={false} tickLine={false} tickFormatter={(v) => { const d = new Date(v); return `${d.getDate()}/${d.getMonth() + 1}`; }} interval="preserveStartEnd" />
              <YAxis tick={{ fill: '#71717a', fontSize: 10 }} axisLine={false} tickLine={false} domain={['auto', 'auto']} width={50} />
              <Tooltip content={<CustomTooltip />} />
              <ReferenceLine y={bep} stroke={priceAboveBep ? '#10b981' : '#ef4444'} strokeDasharray="5 3" strokeWidth={1.5} onMouseEnter={() => setShowBepLabel(true)} onMouseLeave={() => setShowBepLabel(false)} label={showBepLabel ? { value: blurValues ? 'BEP: ••••' : `BEP: ${currency} ${bep.toFixed(2)}`, fill: priceAboveBep ? '#10b981' : '#ef4444', fontSize: 11, position: 'right' } : { value: 'BEP', fill: '#71717a', fontSize: 10, position: 'right' }} />
              {monthLines.map((date) => (<ReferenceLine key={date} x={date} stroke="#3f3f46" strokeWidth={0.5} strokeDasharray="2 2" />))}
              <Area type="monotone" dataKey="price" stroke={priceAboveBep ? '#10b981' : '#ef4444'} strokeWidth={2} fill="url(#priceGradient)" />
              <Line type="monotone" dataKey="trend" stroke="#8b5cf6" strokeWidth={2} strokeDasharray="5 3" dot={false} name="Trend" />
              {entryPoints.map((point) => (<ReferenceDot key={point.date} x={point.chartDate} y={point.chartPrice} r={5} fill="#fbbf24" stroke="#ffffff" strokeWidth={2} onMouseEnter={() => setHoveredEntry(point)} onMouseLeave={() => setHoveredEntry(null)} />))}
            </AreaChart>
          </ResponsiveContainer>
        </div>
        {hoveredEntry && (<div className="mt-2"><EntryTooltipContent entry={hoveredEntry} currency={currency} /></div>)}
      </div>
      
      {/* BEP Summary */}
      <div className="px-5 pb-5">
        <div className="p-3 rounded-lg border border-zinc-700/50 bg-zinc-800/30">
          <div className="flex items-center justify-between">
            <span className="text-xs text-zinc-400">Break-Even Price</span>
            <span className={`text-sm font-semibold ${blurValues ? 'blur-sm select-none' : ''} ${priceAboveBep ? 'text-emerald-400' : 'text-red-400'}`}>
              {blurValues ? '••••' : `${currency} ${bep.toFixed(2)}`}
            </span>
          </div>
          <div className="flex items-center justify-between mt-1">
            <span className="text-xs text-zinc-400">vs Current</span>
            <span className={`text-xs ${priceAboveBep ? 'text-emerald-400' : 'text-red-400'}`}>
              {priceAboveBep ? '+' : ''}{(((currentPrice - bep) / bep) * 100).toFixed(2)}%
            </span>
          </div>
        </div>
      </div>

      {/* Entries list */}
      <div className="px-5 pb-5">
        <h3 className="text-sm font-medium text-zinc-400 mb-3">Entries</h3>
        <div className="space-y-2">
          {entries.map((entry, i) => (
            <div key={i} className="flex items-center justify-between p-3 rounded-lg bg-zinc-800/50 border border-zinc-700/50">
              <div>
                <p className="text-xs text-zinc-400">{entry.date}</p>
                <p className="text-sm text-white font-medium">
                  {entry.qty} × {blurValues ? '••••' : `${currency} ${entry.price.toFixed(2)}`}
                </p>
              </div>
              <p className={`text-sm text-zinc-300 ${blurValues ? 'blur-sm select-none' : ''}`}>
                {blurValues ? '••••' : `${currency} ${(entry.qty * entry.price).toFixed(2)}`}
              </p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}