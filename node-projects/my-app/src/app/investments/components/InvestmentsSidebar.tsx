'use client';

import { Plus, Trash2, TrendingDown, TrendingUp, X } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import {
  Area,
  AreaChart,
  ComposedChart,
  Customized,
  Line,
  ReferenceDot,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { createEntry, deleteEntry } from '@/app/investments/data';

interface Entry {
  id?: string;
  symbol?: string;
  date: string;
  qty: number;
  price: number;
  currency?: string;
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
  onEntriesChange?: () => void;
  blurValues?: boolean;
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

function EntryTooltipContent({ entry, currency, blurValues }: { entry: Entry; currency: string; blurValues?: boolean }) {
  return (
    <div className="bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-xs shadow-xl">
      <p className="text-zinc-400">{entry.date}</p>
      <p className={`text-white font-medium ${blurValues ? 'blur-sm select-none' : ''}`}>
        QTY: {entry.qty} @ {currency} {blurValues ? '••••' : entry.price.toFixed(2)}
      </p>
      <p className={`text-zinc-300 ${blurValues ? 'blur-sm select-none' : ''}`}>
        Value: {currency} {blurValues ? '••••' : (entry.qty * entry.price).toFixed(2)}
      </p>
    </div>
  );
}

function CustomTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null;
  const d = payload[0]?.payload;
  if (d?.open !== undefined) {
    const isUp = d.close >= d.open;
    const color = isUp ? '#10b981' : '#ef4444';
    return (
      <div className="bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-xs shadow-xl">
        <p className="text-zinc-400">{label}</p>
        <div className="flex gap-3 mt-1">
          <span className="text-zinc-400">O <span style={{ color }}>{d.open.toFixed(2)}</span></span>
          <span className="text-zinc-400">H <span style={{ color }}>{d.high.toFixed(2)}</span></span>
          <span className="text-zinc-400">L <span style={{ color }}>{d.low.toFixed(2)}</span></span>
          <span className="text-zinc-400">C <span style={{ color }}>{d.close.toFixed(2)}</span></span>
        </div>
      </div>
    );
  }
  return (
    <div className="bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-xs shadow-xl">
      <p className="text-zinc-400">{label}</p>
      <p className="text-white font-medium">{payload[0].value?.toFixed(2)}</p>
    </div>
  );
}

function OhlcCandles({ ohlcData, entryPoints, width, height, offset, onHoverEntry, onLeaveEntry }: { ohlcData: any[]; entryPoints: any[]; width: number; height: number; offset: any; onHoverEntry: (e: any) => void; onLeaveEntry: () => void }) {
  if (!ohlcData?.length || !width || !height) return null;

  const { top = 10, left = 0, right = 10, bottom = 0 } = offset || {};
  const plotW = width - left - right;
  const plotH = height - top - bottom;

  const allPrices = ohlcData.flatMap((d) => [d.high, d.low]);
  const minP = Math.min(...allPrices);
  const maxP = Math.max(...allPrices);
  const pad = (maxP - minP) * 0.05 || 1;
  const pMin = minP - pad;
  const pMax = maxP + pad;

  const toY = (p: number) => top + ((pMax - p) / (pMax - pMin)) * plotH;
  const barW = Math.max(plotW / ohlcData.length * 0.6, 2);

  const dateToIdx = new Map(ohlcData.map((d, i) => [d.date, i]));

  return (
    <g>
      {ohlcData.map((d, i) => {
        if (d.open === undefined) return null;
        const { open, high, low, close } = d;
        const isUp = close >= open;
        const color = isUp ? '#34d399' : '#71717a';
        const cx = left + (i + 0.5) * (plotW / ohlcData.length);
        const bodyTop = toY(Math.max(open, close));
        const bodyBot = toY(Math.min(open, close));
        const bodyH = Math.max(bodyBot - bodyTop, 1);
        return (
          <g key={i}>
            <line x1={cx} y1={toY(high)} x2={cx} y2={bodyTop} stroke={color} strokeWidth={1} />
            <line x1={cx} y1={bodyBot} x2={cx} y2={toY(low)} stroke={color} strokeWidth={1} />
            <rect x={cx - barW / 2} y={bodyTop} width={barW} height={bodyH} fill={color} stroke={color} strokeWidth={0.5} rx={0.5} />
          </g>
        );
      })}
      {entryPoints.map((point) => {
        const idx = dateToIdx.get(point.chartDate);
        if (idx === undefined) return null;
        const cx = left + (idx + 0.5) * (plotW / ohlcData.length);
        const cy = toY(point.chartPrice);
        return (
          <g key={point.date} onMouseEnter={() => onHoverEntry(point)} onMouseLeave={onLeaveEntry} style={{ cursor: 'pointer' }}>
            <circle cx={cx} cy={cy} r={5} fill="#fbbf24" stroke="#ffffff" strokeWidth={2} />
            <text x={cx} y={cy - 10} textAnchor="middle" fill="#fbbf24" fontSize={9}>{point.qty > 0 ? '+' : ''}{point.qty}</text>
          </g>
        );
      })}
    </g>
  );
}

function LiquidityZones({ volumeProfile, entryPoints, width, height, offset, currentPrice, bep, currency, onHoverEntry, onLeaveEntry }: { volumeProfile: any[]; entryPoints: any[]; width: number; height: number; offset: any; currentPrice: number; bep: number; currency: string; onHoverEntry: (e: any) => void; onLeaveEntry: () => void }) {
  if (!volumeProfile?.length || !width || !height) return null;

  const { top = 10, left = 0, right = 10, bottom = 0 } = offset || {};
  const plotW = width - left - right;
  const plotH = height - top - bottom;

  const allPrices = volumeProfile.map((z) => z.price);
  const minP = Math.min(...allPrices) * 0.95;
  const maxP = Math.max(...allPrices) * 1.05;
  const pMin = Math.min(minP, currentPrice * 0.9);
  const pMax = Math.max(maxP, currentPrice * 1.1);

  const toY = (p: number) => top + ((pMax - p) / (pMax - pMin)) * plotH;
  const bandH = Math.max(Math.min(plotH / volumeProfile.length * 0.7, 20), 4);

  return (
    <g>
      <defs>
        {volumeProfile.map((zone, i) => (
          <linearGradient key={i} id={`zoneGrad-${i}`} x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor="#34d399" stopOpacity={0} />
            <stop offset="25%" stopColor="#34d399" stopOpacity={zone.intensity * 0.4} />
            <stop offset="50%" stopColor="#10b981" stopOpacity={zone.intensity * 0.7} />
            <stop offset="75%" stopColor="#34d399" stopOpacity={zone.intensity * 0.4} />
            <stop offset="100%" stopColor="#34d399" stopOpacity={0} />
          </linearGradient>
        ))}
      </defs>

      {volumeProfile.map((zone, i) => {
        const cy = toY(zone.price);
        return (
          <g key={i}>
            <rect
              x={left}
              y={cy - bandH / 2}
              width={plotW}
              height={bandH}
              fill={`url(#zoneGrad-${i})`}
              rx={2}
            />
            <text
              x={left + plotW + 4}
              y={cy + 3}
              fill="#a1a1aa"
              fontSize={9}
              textAnchor="start"
            >
              {currency} {zone.allocation.toFixed(0)}
            </text>
          </g>
        );
      })}

      <line x1={left} y1={toY(currentPrice)} x2={left + plotW} y2={toY(currentPrice)} stroke="#ffffff" strokeWidth={1.5} strokeDasharray="4 2" />
      <text x={left + plotW + 4} y={toY(currentPrice) + 3} fill="#ffffff" fontSize={9} fontWeight="bold">
        {currentPrice.toFixed(2)}
      </text>

      <line x1={left} y1={toY(bep)} x2={left + plotW} y2={toY(bep)} stroke={currentPrice >= bep ? '#10b981' : '#ef4444'} strokeWidth={1} strokeDasharray="5 3" />
      <text x={left + plotW + 4} y={toY(bep) + 3} fill={currentPrice >= bep ? '#10b981' : '#ef4444'} fontSize={9}>
        BEP
      </text>

      {entryPoints.map((point) => {
        const cy = toY(point.chartPrice);
        const cx = left + plotW * 0.5;
        return (
          <g key={point.date} onMouseEnter={() => onHoverEntry(point)} onMouseLeave={onLeaveEntry} style={{ cursor: 'pointer' }}>
            <circle cx={cx} cy={cy} r={5} fill="#fbbf24" stroke="#ffffff" strokeWidth={2} />
            <text x={cx + 10} y={cy + 3} fill="#fbbf24" fontSize={9}>{point.qty > 0 ? '+' : ''}{point.qty}</text>
          </g>
        );
      })}
    </g>
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
  onEntriesChange,
  blurValues = false,
}: SidebarProps) {
  const [priceHistory, setPriceHistory] = useState<{ date: string; price: number }[]>([]);
  const [hoveredEntry, setHoveredEntry] = useState<Entry | null>(null);
  const [showBepLabel, setShowBepLabel] = useState(false);
  const [timeRange, setTimeRange] = useState<30 | 90 | 180 | 365 | 730 | 1000>(1000);
  const [chartType, setChartType] = useState<'line' | 'ohlc' | 'liquidity'>('line');
  const [chartLoading, setChartLoading] = useState(false);
  const [newDate, setNewDate] = useState(new Date().toISOString().split('T')[0]);
  const [newQty, setNewQty] = useState('');
  const [newPrice, setNewPrice] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const isPositive = change24h >= 0;
  const priceAboveBep = currentPrice >= bep;

  const handleChartTypeChange = (type: 'line' | 'ohlc' | 'liquidity') => {
    setChartLoading(true);
    setChartType(type);
    requestAnimationFrame(() => setChartLoading(false));
  };

  useEffect(() => {
    if (isOpen) {
      setChartLoading(true);
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
        setChartLoading(false);
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

  const ohlcData = useMemo(() => {
    if (priceHistory.length < 2) return [];
    const capped = trendline.slice(-730);
    return capped.map((p, i) => {
      const prev = i > 0 ? capped[i - 1].price : p.price;
      const open = prev;
      const close = p.price;
      const volatility = 0.015;
      const seed = p.date.split('-').reduce((a, c) => a + parseInt(c), 0);
      const rand = (n: number) => ((Math.sin(seed * 9301 + n * 49297) + 1) / 2);
      const highExtra = rand(i * 3) * volatility * p.price;
      const lowExtra = rand(i * 3 + 1) * volatility * p.price;
      const high = Math.max(open, close) + highExtra;
      const low = Math.min(open, close) - lowExtra;
      return { date: p.date, open, high, low, close, trend: p.trend };
    });
  }, [trendline, priceHistory.length]);

  const volumeProfile = useMemo(() => {
    if (!entries.length) return [];
    const allPrices = entries.map((e) => e.price);
    const minP = Math.min(...allPrices);
    const maxP = Math.max(...allPrices);
    const range = maxP - minP;
    const binSize = range > 10000 ? 1000 : range > 1000 ? 100 : range > 100 ? 10 : 1;

    const priceMap = new Map<number, { qty: number; allocation: number }>();
    entries.forEach((entry) => {
      const rounded = Math.round(entry.price / binSize) * binSize;
      const current = priceMap.get(rounded) || { qty: 0, allocation: 0 };
      priceMap.set(rounded, {
        qty: current.qty + Math.abs(entry.qty),
        allocation: current.allocation + Math.abs(entry.qty) * entry.price,
      });
    });

    const maxAllocation = Math.max(...Array.from(priceMap.values()).map((v) => v.allocation), 1);
    return Array.from(priceMap.entries())
      .map(([price, data]) => ({
        price,
        qty: data.qty,
        allocation: data.allocation,
        intensity: data.allocation / maxAllocation,
      }))
      .sort((a, b) => a.price - b.price);
  }, [entries]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const qty = parseFloat(newQty);
    const price = parseFloat(newPrice);
    if (!newDate || isNaN(qty) || isNaN(price) || qty === 0 || price === 0) return;

    setSubmitting(true);
    const result = await createEntry({ symbol, date: newDate, qty, price, currency });
    setSubmitting(false);

    if (result) {
      setNewQty('');
      setNewPrice('');
      onEntriesChange?.();
    }
  };

  const handleDelete = async (id: string) => {
    const ok = await deleteEntry(id);
    if (ok) onEntriesChange?.();
  };

  if (!isOpen) return null;

  return (
    <div className="w-[60%] h-full border-l border-zinc-800 overflow-y-auto flex-shrink-0">
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
          <button onClick={onClose} className="p-2 rounded-lg hover:bg-zinc-800 text-zinc-400 hover:text-white transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Chart */}
      <div className="p-5">
        <h3 className="text-sm font-medium text-zinc-400 mb-3">Price History</h3>
        <div className="flex items-center justify-between mb-3">
          <div className="flex gap-1">
            {[
              { value: 30, label: '1M' },
              { value: 90, label: '3M' },
              { value: 180, label: '6M' },
              { value: 365, label: '1Y' },
              { value: 730, label: '2Y' },
              { value: 1000, label: 'Full' },
            ].map((range) => (
              <button
                key={range.value}
                onClick={() => setTimeRange(range.value as 30 | 90 | 180 | 365 | 730 | 1000)}
                className={`px-3 py-1 text-xs rounded-full transition-colors ${
                  timeRange === range.value ? 'bg-emerald-600 text-white' : 'bg-zinc-800 text-zinc-400 hover:text-white'
                }`}
              >
                {range.label}
              </button>
            ))}
          </div>
          <div className="flex gap-1 bg-zinc-800 rounded-full p-0.5">
            <button
              onClick={() => handleChartTypeChange('line')}
              className={`px-2.5 py-0.5 text-xs rounded-full transition-colors ${
                chartType === 'line' ? 'bg-zinc-600 text-white' : 'text-zinc-400 hover:text-white'
              }`}
            >
              Line
            </button>
            <button
              onClick={() => handleChartTypeChange('ohlc')}
              className={`px-2.5 py-0.5 text-xs rounded-full transition-colors ${
                chartType === 'ohlc' ? 'bg-zinc-600 text-white' : 'text-zinc-400 hover:text-white'
              }`}
            >
              OHLC
            </button>
            <button
              onClick={() => handleChartTypeChange('liquidity')}
              className={`px-2.5 py-0.5 text-xs rounded-full transition-colors ${
                chartType === 'liquidity' ? 'bg-zinc-600 text-white' : 'text-zinc-400 hover:text-white'
              }`}
            >
              Liquidity
            </button>
          </div>
        </div>
        <div className="h-96 w-full relative">
          {chartLoading && (
            <div className="absolute inset-0 z-10 flex items-center justify-center backdrop-blur-sm rounded-lg">
              <div className="flex flex-col items-center gap-2">
                <div className="w-6 h-6 border-2 border-emerald-400 border-t-transparent rounded-full animate-spin" />
                <span className="text-xs text-zinc-400">Loading chart...</span>
              </div>
            </div>
          )}
          {chartType === 'line' ? (
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
              {entryPoints.map((point) => (<ReferenceDot key={point.date} x={point.chartDate} y={point.chartPrice} r={5} fill="#fbbf24" stroke="#ffffff" strokeWidth={2} onMouseEnter={() => setHoveredEntry(point)} onMouseLeave={() => setHoveredEntry(null)} label={{ value: `${point.qty > 0 ? '+' : ''}${point.qty}`, position: 'top', fill: '#fbbf24', fontSize: 9, offset: 10 }} />))}
            </AreaChart>
          </ResponsiveContainer>
          ) : chartType === 'ohlc' ? (
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart data={ohlcData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
              <XAxis dataKey="date" tick={{ fill: '#71717a', fontSize: 10 }} axisLine={false} tickLine={false} tickFormatter={(v) => { const d = new Date(v); return `${d.getDate()}/${d.getMonth() + 1}`; }} interval="preserveStartEnd" />
              <YAxis tick={{ fill: '#71717a', fontSize: 10 }} axisLine={false} tickLine={false} domain={['auto', 'auto']} width={50} />
              <Tooltip content={<CustomTooltip />} cursor={false} />
              <ReferenceLine y={bep} stroke={priceAboveBep ? '#10b981' : '#ef4444'} strokeDasharray="5 3" strokeWidth={1.5} onMouseEnter={() => setShowBepLabel(true)} onMouseLeave={() => setShowBepLabel(false)} label={showBepLabel ? { value: blurValues ? 'BEP: ••••' : `BEP: ${currency} ${bep.toFixed(2)}`, fill: priceAboveBep ? '#10b981' : '#ef4444', fontSize: 11, position: 'right' } : { value: 'BEP', fill: '#71717a', fontSize: 10, position: 'right' }} />
              {monthLines.map((date) => (<ReferenceLine key={date} x={date} stroke="#3f3f46" strokeWidth={0.5} strokeDasharray="2 2" />))}
              <Customized component={({ width, height, offset }: any) => <OhlcCandles ohlcData={ohlcData} entryPoints={entryPoints} width={width} height={height} offset={offset} onHoverEntry={setHoveredEntry} onLeaveEntry={() => setHoveredEntry(null)} />} />
            </ComposedChart>
          </ResponsiveContainer>
          ) : (
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart data={trendline} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
              <XAxis dataKey="date" tick={{ fill: '#71717a', fontSize: 10 }} axisLine={false} tickLine={false} tickFormatter={(v) => { const d = new Date(v); return `${d.getDate()}/${d.getMonth() + 1}`; }} interval="preserveStartEnd" />
              <YAxis tick={{ fill: '#71717a', fontSize: 10 }} axisLine={false} tickLine={false} domain={['auto', 'auto']} width={50} />
              <Tooltip content={<CustomTooltip />} cursor={false} />
              {monthLines.map((date) => (<ReferenceLine key={date} x={date} stroke="#3f3f46" strokeWidth={0.5} strokeDasharray="2 2" />))}
              <Line type="monotone" dataKey="price" stroke="#a1a1aa" strokeWidth={1} dot={false} opacity={0.1} />
              <Customized component={({ width, height, offset }: any) => <LiquidityZones volumeProfile={volumeProfile} entryPoints={entryPoints} width={width} height={height} offset={offset} currentPrice={currentPrice} bep={bep} currency={currency} onHoverEntry={setHoveredEntry} onLeaveEntry={() => setHoveredEntry(null)} />} />
            </ComposedChart>
          </ResponsiveContainer>
          )}
        </div>
        {hoveredEntry && (<div className="mt-2"><EntryTooltipContent entry={hoveredEntry} currency={currency} blurValues={blurValues} /></div>)}
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

      {/* Add Entry Form */}
      <div className="px-5 pb-4">
        <h3 className="text-sm font-medium text-zinc-400 mb-3">Add Entry</h3>
        <form onSubmit={handleSubmit} className="space-y-2">
          <input
            type="date"
            value={newDate}
            onChange={(e) => setNewDate(e.target.value)}
            className="w-full px-3 py-2 text-sm rounded-lg bg-zinc-800 border border-zinc-700 text-white focus:outline-none focus:ring-1 focus:ring-emerald-500"
          />
          <div className="flex gap-2">
            <input
              type="number"
              step="any"
              placeholder="Qty"
              value={newQty}
              onChange={(e) => setNewQty(e.target.value)}
              className="flex-1 px-3 py-2 text-sm rounded-lg bg-zinc-800 border border-zinc-700 text-white placeholder-zinc-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
            />
            <input
              type="number"
              step="any"
              placeholder="Price"
              value={newPrice}
              onChange={(e) => setNewPrice(e.target.value)}
              className="flex-1 px-3 py-2 text-sm rounded-lg bg-zinc-800 border border-zinc-700 text-white placeholder-zinc-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
            />
          </div>
          <button
            type="submit"
            disabled={submitting || !newDate || !newQty || !newPrice}
            className="w-full flex items-center justify-center gap-2 px-3 py-2 text-sm rounded-lg bg-emerald-600 hover:bg-emerald-500 disabled:opacity-40 disabled:cursor-not-allowed text-white transition-colors"
          >
            <Plus className="w-4 h-4" />
            {submitting ? 'Adding...' : 'Add Entry'}
          </button>
        </form>
      </div>

      {/* Entries list */}
      <div className="px-5 pb-5">
        <h3 className="text-sm font-medium text-zinc-400 mb-2">Entries</h3>
        <div className="space-y-1">
          {entries.map((entry, i) => (
            <div key={entry.id || i} className="flex items-center justify-between px-2.5 py-1.5 rounded bg-zinc-800/50 border border-zinc-700/50 group">
              <span className="text-[11px] text-zinc-400">{entry.date}</span>
              <span className="text-[11px] text-white">
                {entry.qty} × {blurValues ? '••••' : `${currency} ${entry.price.toFixed(2)}`}
              </span>
              <span className={`text-[11px] text-zinc-300 ${blurValues ? 'blur-sm select-none' : ''}`}>
                {blurValues ? '••••' : `${currency} ${(entry.qty * entry.price).toFixed(2)}`}
              </span>
              {entry.id && (
                <button
                  onClick={() => handleDelete(entry.id!)}
                  className="p-0.5 rounded opacity-0 group-hover:opacity-100 hover:bg-red-500/20 text-zinc-500 hover:text-red-400 transition-all"
                  title="Delete entry"
                >
                  <Trash2 className="w-3 h-3" />
                </button>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
