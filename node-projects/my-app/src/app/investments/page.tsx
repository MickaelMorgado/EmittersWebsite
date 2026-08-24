'use client';

import { useState } from 'react';
import { Activity } from 'lucide-react';
import {
  BarChart, Bar, LineChart, Line,
  XAxis, YAxis, Tooltip, Legend, ResponsiveContainer, ReferenceLine
} from 'recharts';

type Product = { name: string; price: number; features: string[] };
type Category = { id: string; label: string; active: boolean; selected: string; items: Product[] };

const NET_WORTH = 14099;
const MONTHLY_GROWTH = 496;

const history = [
  { month: 'Apr 25', value: 6658 },
  { month: 'May', value: 7307 },
  { month: 'Jun', value: 7688 },
  { month: 'Jul', value: 7852 },
  { month: 'Aug', value: 8277 },
  { month: 'Sep', value: 9101 },
  { month: 'Oct', value: 9358 },
  { month: 'Nov', value: 9506 },
  { month: 'Dec', value: 9594 },
  { month: 'Jan 26', value: 10842 },
  { month: 'Feb', value: 12060 },
  { month: 'Mar', value: 12157 },
  { month: 'Apr', value: 13484 },
  { month: 'May', value: 13816 },
  { month: 'Jun', value: 13790 },
  { month: 'Jul', value: 14099 },
];

const initialCategories: Category[] = [
  {
    id: 'smartwatch',
    label: 'SMARTWATCH',
    active: true,
    selected: 'KOSPET ORB 2',
    items: [
      { name: 'KOSPET ORB 2', price: 81, features: ['HR Broadcast', 'Dual-band GPS', 'AMOLED', '16-day battery', 'Amazon.es €81'] },
      { name: 'KOSPET PULSE 2', price: 70, features: ['HR Broadcast', 'Dual-band GPS', 'Square AMOLED', '16-day battery'] },
      { name: 'Amazfit GTR 4', price: 100, features: ['HR (app only)', 'GPS', 'AMOLED', '14-day battery'] },
      { name: 'COROS Pace 3', price: 210, features: ['HR Broadcast', 'Dual-band GPS', 'AMOLED', '38h GPS'] },
      { name: 'Polar H10 (strap)', price: 90, features: ['Gold standard HR', 'ANT+ & BLE', '500h battery'] },
    ],
  },
  {
    id: 'car-repair',
    label: 'CAR REPAIR',
    active: false,
    selected: 'BMW Full Service',
    items: [
      { name: 'BMW Full Service', price: 2000, features: ['Transmission chain (€1400)', 'Diagnostics + labor', 'BMW 116d F20 EFDYN2015'] },
      { name: 'Chain Only', price: 1400, features: ['Transmission chain', 'BMW 116d F20 EFDYN2015'] },
      { name: 'Diagnostics Only', price: 150, features: ['OBD2 scan', 'Engine + transmission'] },
      { name: 'Rear Light Replacement', price: 50, features: ['LED rear light', 'BMW 116d F20 EFDYN2015'] },
    ],
  },
];

function getTotalCost(categories: Category[]) {
  return categories.reduce((sum, cat) => {
    if (!cat.active) return sum;
    const item = cat.items.find((i) => i.name === cat.selected);
    return sum + (item?.price ?? 0);
  }, 0);
}

function getChartData(totalCost: number, showHistory: boolean) {
  const future = [
    { month: 'Jul 26', baseline: NET_WORTH, withPurchase: NET_WORTH - totalCost, history: null as number | null },
    { month: 'M1', baseline: NET_WORTH + MONTHLY_GROWTH, withPurchase: NET_WORTH - totalCost + MONTHLY_GROWTH, history: null },
    { month: 'M3', baseline: NET_WORTH + MONTHLY_GROWTH * 3, withPurchase: NET_WORTH - totalCost + MONTHLY_GROWTH * 3, history: null },
    { month: 'M6', baseline: NET_WORTH + MONTHLY_GROWTH * 6, withPurchase: NET_WORTH - totalCost + MONTHLY_GROWTH * 6, history: null },
    { month: 'M12', baseline: NET_WORTH + MONTHLY_GROWTH * 12, withPurchase: NET_WORTH - totalCost + MONTHLY_GROWTH * 12, history: null },
  ];
  if (!showHistory) return future;
  const past = history.map((h) => ({ month: h.month, baseline: null, withPurchase: null, history: h.value }));
  return [...past, ...future];
}

function ChartTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null;
  return (
    <div style={{ background: '#111111' }} className="px-3 py-2">
      <p className="text-[10px] font-mono" style={{ color: '#666666' }}>{label}</p>
      {payload.map((p: any, i: number) => (
        <p key={i} className="text-[11px] font-mono" style={{ color: '#f0f0f0' }}>
          {p.name}: €{p.value.toLocaleString()}
        </p>
      ))}
    </div>
  );
}

function Stat({ label, value, accent = false }: { label: string; value: string; accent?: boolean }) {
  return (
    <div className="flex flex-col">
      <span className="text-[10px] uppercase tracking-wider" style={{ color: '#666666' }}>{label}</span>
      <span className="text-lg font-mono" style={{ color: accent ? '#00ff88' : '#f0f0f0' }}>{value}</span>
    </div>
  );
}

export default function InvestmentPage() {
  const [categories, setCategories] = useState<Category[]>(initialCategories);
  const [showHistory, setShowHistory] = useState(true);
  const [logScale, setLogScale] = useState(true);

  const totalCost = getTotalCost(categories);
  const pctNetWorth = ((totalCost / NET_WORTH) * 100).toFixed(2);
  const pctGrowth = ((totalCost / MONTHLY_GROWTH) * 100).toFixed(1);
  const n26After = 827 - totalCost;
  const workDays = Math.ceil(totalCost / (MONTHLY_GROWTH / 22));
  const chartData = getChartData(totalCost, showHistory);
  const activeCategory = categories.find((c) => c.active);
  const selectedItem = activeCategory?.items.find((i) => i.name === activeCategory.selected);

  function toggleCategory(id: string) {
    setCategories((prev) =>
      prev.map((c) => (c.id === id ? { ...c, active: !c.active } : c))
    );
  }

  function selectItem(categoryId: string, itemName: string) {
    setCategories((prev) =>
      prev.map((c) => (c.id === categoryId ? { ...c, selected: itemName, active: true } : c))
    );
  }

  return (
    <div className="h-screen overflow-hidden p-6" style={{ background: '#0a0a0a', color: '#f0f0f0' }}>
      <style>{`
        ::-webkit-scrollbar { width: 6px; height: 6px; }
        ::-webkit-scrollbar-track { background: #0a0a0a; }
        ::-webkit-scrollbar-thumb { background: #333333; border-radius: 0; }
        ::-webkit-scrollbar-thumb:hover { background: '#00ff88'; }
        * { scrollbar-width: thin; scrollbar-color: #333333 #0a0a0a; -ms-overflow-style: none; }
      `}</style>

      <div className="h-full flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between pb-4" style={{ borderBottom: '1px solid #222222' }}>
          <div>
            <h1 className="text-sm font-light uppercase tracking-widest" style={{ color: '#f0f0f0' }}>
              INVESTMENT // ANALYSIS
            </h1>
            <p className="text-[10px] mt-1" style={{ color: '#666666' }}>
              {totalCost > 0 ? `TOTAL: €${totalCost}` : 'NO ITEMS SELECTED'} — <span style={{ color: '#00ff88' }}>JUL 31, 2026</span>
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Activity className="w-3 h-3" style={{ color: '#ff073a' }} />
            <span className="text-[10px] font-mono" style={{ color: '#ff073a' }}>FASCICULAR BLOCK</span>
          </div>
        </div>

        {/* Key Metrics */}
        <div className="flex items-center gap-8 py-3" style={{ borderBottom: '1px solid #222222' }}>
          <Stat label="Total Cost" value={totalCost > 0 ? `€${totalCost}` : '€0'} accent={totalCost > 0} />
          <span style={{ color: '#222222' }}>|</span>
          <Stat label="% Net Worth" value={totalCost > 0 ? `${pctNetWorth}%` : '0%'} />
          <span style={{ color: '#222222' }}>|</span>
          <Stat label="% Monthly Growth" value={totalCost > 0 ? `${pctGrowth}%` : '0%'} />
          <span style={{ color: '#222222' }}>|</span>
          <Stat label="N26 After" value={totalCost > 0 ? `€${n26After}` : '€827'} />
          <span style={{ color: '#222222' }}>|</span>
          <Stat label="Work Days" value={totalCost > 0 ? `${workDays}d` : '0d'} accent={totalCost > 0} />
          <span style={{ color: '#222222' }}>|</span>
          <Stat label="12mo Delta" value={totalCost > 0 ? `-€${totalCost}` : '€0'} />
        </div>

        {/* Main Content - 65/35 split */}
        <div className="flex-1 flex gap-0 min-h-0">
          {/* Left 65% */}
          <div className="w-[65%] flex flex-col" style={{ borderRight: '1px solid #222222' }}>
            {/* Growth Projection */}
            <div className="flex-1 p-6" style={{ borderBottom: '1px solid #222222' }}>
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-[10px] uppercase tracking-wider" style={{ color: '#666666' }}>
                  NET WORTH {showHistory ? '(HISTORY + PROJECTION)' : '(PROJECTION)'}
                </h3>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setLogScale(!logScale)}
                    className="text-[9px] font-mono px-1.5 py-1 transition-colors"
                    style={{
                      border: `1px solid ${logScale ? '#00ff8830' : '#333333'}`,
                      color: logScale ? '#00ff88' : '#666666',
                      background: logScale ? 'rgba(0,255,136,0.03)' : 'transparent',
                    }}
                    title="Toggle logarithmic scale"
                  >
                    LOG
                  </button>
                  <button
                    onClick={() => setShowHistory(!showHistory)}
                    className="text-[9px] font-mono uppercase tracking-wider px-2 py-1 transition-colors"
                    style={{
                      border: `1px solid ${showHistory ? '#00ff8830' : '#333333'}`,
                      color: showHistory ? '#00ff88' : '#666666',
                      background: showHistory ? 'rgba(0,255,136,0.03)' : 'transparent',
                    }}
                  >
                    {showHistory ? 'HISTORY ON' : 'HISTORY OFF'}
                  </button>
                </div>
              </div>
              <ResponsiveContainer width="100%" height="85%">
                <LineChart data={chartData}>
                  <XAxis dataKey="month" stroke="#222222" tick={{ fill: '#666666', fontSize: 10 }} interval={showHistory ? 2 : 0} />
                  <YAxis stroke="#222222" scale={logScale ? 'log' : 'auto'} domain={logScale ? [5000, 25000] : ['dataMin - 500', 'dataMax + 500']} tick={{ fill: '#666666', fontSize: 10 }} tickFormatter={(v) => `€${(v / 1000).toFixed(1)}k`} />
                  <Tooltip content={<ChartTooltip />} />
                  {showHistory && (
                    <Line type="monotone" dataKey="history" name="Actual" stroke="#00ff88" strokeWidth={1.5} dot={{ fill: '#00ff88', r: 2 }} connectNulls={false} />
                  )}
                  <Line type="monotone" dataKey="baseline" name="Baseline" stroke="#666666" strokeWidth={1} dot={{ fill: '#666666', r: 2 }} strokeDasharray="4 4" connectNulls={false} />
                  {totalCost > 0 && (
                    <Line type="monotone" dataKey="withPurchase" name="With Purchase" stroke="#00ff88" strokeWidth={2} dot={{ fill: '#00ff88', r: 3 }} activeDot={{ r: 5 }} connectNulls={false} />
                  )}
                </LineChart>
              </ResponsiveContainer>
              <div className="text-center mt-1">
                <span className="text-[9px] font-mono" style={{ color: '#666666' }}>
                  {totalCost > 0
                    ? `€${totalCost} GAP = CONSISTENT ACROSS 12 MONTHS — ${(totalCost / (NET_WORTH + MONTHLY_GROWTH * 12) * 100).toFixed(2)}% OF M12 PORTFOLIO`
                    : 'SELECT A CATEGORY AND PRODUCT TO SEE IMPACT'}
                </span>
              </div>
            </div>

            {/* Cost vs Benefit */}
            <div className="p-6">
              <h3 className="text-[10px] uppercase tracking-wider mb-3" style={{ color: '#666666' }}>
                COST AMORTIZATION
              </h3>
              <ResponsiveContainer width="100%" height={140}>
                <BarChart data={[
                  { period: '1 MO', cost: totalCost },
                  { period: '6 MO', cost: Math.round((totalCost / 6) * 100) / 100 },
                  { period: '12 MO', cost: Math.round((totalCost / 12) * 100) / 100 },
                  { period: '24 MO', cost: Math.round((totalCost / 24) * 100) / 100 },
                ]}>
                  <XAxis dataKey="period" stroke="#222222" tick={{ fill: '#666666', fontSize: 10 }} />
                  <YAxis stroke="#222222" tick={{ fill: '#666666', fontSize: 10 }} tickFormatter={(v) => `€${v}`} />
                  <Tooltip content={<ChartTooltip />} />
                  <Bar dataKey="cost" fill={totalCost > 0 ? '#00ff88' : '#333333'} fillOpacity={0.6} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Right 35% */}
          <div className="w-[35%] flex flex-col overflow-y-auto">
            {/* Categories */}
            <div className="p-6" style={{ borderBottom: '1px solid #222222' }}>
              <h3 className="text-[10px] uppercase tracking-wider mb-3" style={{ color: '#666666' }}>
                CATEGORIES
              </h3>
              <div className="space-y-1">
                {categories.map((cat) => (
                  <div key={cat.id}>
                    {/* Category toggle */}
                    <button
                      onClick={() => toggleCategory(cat.id)}
                      className="w-full flex items-center justify-between py-2 px-2 text-[11px] font-mono uppercase tracking-wider transition-colors"
                      style={{
                        color: cat.active ? '#00ff88' : '#666666',
                        background: cat.active ? 'rgba(0,255,136,0.03)' : 'transparent',
                        borderBottom: '1px solid #1a1a1a',
                      }}
                    >
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2" style={{ background: cat.active ? '#00ff88' : '#333333' }} />
                        {cat.label}
                      </div>
                      <span className="text-[9px]" style={{ color: cat.active ? '#00ff88' : '#444444' }}>
                        {cat.items.length} ITEMS
                      </span>
                    </button>

                    {/* Items (show when category active) */}
                    {cat.active && (
                      <div className="ml-4">
                        {cat.items.map((item) => (
                          <button
                            key={item.name}
                            onClick={() => selectItem(cat.id, item.name)}
                            className="w-full flex items-center justify-between py-1.5 px-2 text-[10px] transition-colors"
                            style={{
                              color: cat.selected === item.name ? '#00ff88' : '#888888',
                              background: cat.selected === item.name ? 'rgba(0,255,136,0.05)' : 'transparent',
                              borderBottom: '1px solid #111111',
                            }}
                          >
                            <div className="flex items-center gap-2">
                              <div className="w-1.5 h-1.5" style={{ background: cat.selected === item.name ? '#00ff88' : '#333333' }} />
                              <span className="font-mono">{item.name}</span>
                            </div>
                            <span className="font-mono" style={{ color: cat.selected === item.name ? '#00ff88' : '#666666' }}>
                              €{item.price}
                            </span>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Selected item details */}
            {selectedItem && (
              <div className="p-6" style={{ borderBottom: '1px solid #222222' }}>
                <h3 className="text-[10px] uppercase tracking-wider mb-2" style={{ color: '#666666' }}>
                  SELECTED // {activeCategory?.label}
                </h3>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-mono" style={{ color: '#00ff88' }}>{selectedItem.name}</span>
                  <span className="text-xs font-mono" style={{ color: '#00ff88' }}>€{selectedItem.price}</span>
                </div>
                <div className="flex flex-wrap gap-1">
                  {selectedItem.features.map((f) => (
                    <span key={f} className="text-[9px] px-1.5 py-0.5" style={{ color: '#666666', background: '#111111' }}>{f}</span>
                  ))}
                </div>
              </div>
            )}

            {/* Verdict */}
            <div className="p-6">
              <h3 className="text-[10px] uppercase tracking-wider mb-3" style={{ color: '#666666' }}>VERDICT</h3>
              {totalCost > 0 ? (
                <p className="text-[11px] leading-relaxed" style={{ color: '#888888' }}>
                  <span style={{ color: '#00ff88' }}>€{totalCost}</span> = <span style={{ color: '#00ff88' }}>{workDays} work days</span>. {pctNetWorth}% of net worth. {pctGrowth}% of monthly growth.
                </p>
              ) : (
                <p className="text-[11px] leading-relaxed" style={{ color: '#888888' }}>
                  SELECT A CATEGORY TO BEGIN ANALYSIS.
                </p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
