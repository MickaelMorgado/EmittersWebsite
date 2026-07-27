'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { VersionBadge } from '@/components/VersionBadge';
import { TrendingUp, Wallet, PiggyBank, ArrowUpRight, Activity, Landmark } from 'lucide-react';
import {
  PieChart, Pie, Cell, BarChart, Bar, LineChart, Line,
  XAxis, YAxis, Tooltip, Legend
} from 'recharts';

const COLORS = ['#10b981', '#3b82f6', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#06b6d4', '#f97316'];

const financeData = {
  summary: {
    netWorth: 13790,
    liquidCash: 11766,
    investments: 2023,
    monthlySurplus: 300,
    growthSinceApr2025: 62.6,
  },
  allocation: [
    { name: 'Bank Savings', value: 9142, percent: 66.5 },
    { name: 'Exodus (BTC+alts)', value: 1432, percent: 10.4 },
    { name: 'Cash Reserve', value: 1405, percent: 10.2 },
    { name: 'N26', value: 819, percent: 5.9 },
    { name: 'Degiro', value: 848, percent: 6.2 },
    { name: 'Coinbase+Crypto.com', value: 95, percent: 0.6 },
    { name: 'XM', value: 50, percent: 0.4 },
  ],
  accounts: [
    { name: 'Bank Savings', value: 9142 },
    { name: 'Exodus', value: 1432 },
    { name: 'Cash Reserve', value: 1405 },
    { name: 'Degiro', value: 848 },
    { name: 'N26', value: 819 },
    { name: 'Coinbase', value: 60 },
    { name: 'XM', value: 50 },
    { name: 'Crypto.com', value: 34 },
  ],
  growth: [
    { date: 'Apr 25', value: 6642 },
    { date: 'Jul 25', value: 8200 },
    { date: 'Oct 25', value: 9500 },
    { date: 'Jan 26', value: 10799 },
    { date: 'Apr 26', value: 12400 },
    { date: 'Jul 26', value: 13790 },
  ],
  emergency: {
    current: 9142,
    target: 4000,
  },
  savingPots: [
    { name: 'Emergency Fund', value: 4000, current: 4000, icon: '🛡️', color: '#10b981' },
    { name: 'Gold Budget', value: 300, current: 0, icon: '🥇', color: '#f59e0b', freq: 'quarterly' },
    { name: 'Long Term Savings', value: 2500, current: 2500, icon: '📈', color: '#3b82f6', note: 'Retirement' },
    { name: 'Sinking Funds', value: 2642, current: 2642, icon: '🎯', color: '#8b5cf6', note: 'Sub-accounts' },
    { name: 'Cash Reserve', value: 1460, current: 1460, icon: '💰', color: '#ec4899', note: 'Inheritance' },
    { name: 'Investment Buffer', value: 500, current: 340, icon: '🚀', color: '#06b6d4', note: 'Opportunities' },
  ],
};

function GlowCard({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={`relative group ${className}`}>
      <div className="absolute -inset-0.5 bg-gradient-to-r from-emerald-500/20 via-blue-500/20 to-purple-500/20 rounded-2xl blur opacity-0 group-hover:opacity-100 transition duration-500" />
      <div className="relative bg-[#0a0a0f] border border-white/5 rounded-2xl backdrop-blur-xl">
        {children}
      </div>
    </div>
  );
}

function SummaryCard({ title, value, subtitle, icon: Icon, trend }: {
  title: string;
  value: string;
  subtitle: string;
  icon: React.ComponentType<{ className?: string }>;
  trend?: 'up' | 'neutral';
}) {
  return (
    <GlowCard>
      <div className="p-5">
        <div className="flex items-center justify-between mb-4">
          <span className="text-[11px] font-medium text-zinc-500 uppercase tracking-[0.2em]">{title}</span>
          <div className={`p-2 rounded-xl ${trend === 'up' ? 'bg-emerald-500/10' : 'bg-blue-500/10'}`}>
            <Icon className={`w-4 h-4 ${trend === 'up' ? 'text-emerald-400' : 'text-blue-400'}`} />
          </div>
        </div>
        <div className="text-2xl font-semibold text-white tracking-tight font-mono">{value}</div>
        <div className="text-xs text-zinc-500 mt-2">{subtitle}</div>
      </div>
    </GlowCard>
  );
}

function CustomTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-[#12121a] border border-white/10 rounded-xl p-4 shadow-2xl backdrop-blur-xl">
      <p className="text-zinc-400 text-xs uppercase tracking-wider mb-1">{label || payload[0].name}</p>
      <p className="text-white text-xl font-semibold font-mono">
        €{payload[0].value.toLocaleString()}
      </p>
    </div>
  );
}

function AllocationTooltip({ active, payload }: any) {
  if (!active || !payload?.length) return null;
  const data = payload[0].payload;
  return (
    <div className="bg-[#12121a] border border-white/10 rounded-xl p-4 shadow-2xl backdrop-blur-xl">
      <p className="text-zinc-400 text-xs uppercase tracking-wider mb-1">{data.name}</p>
      <p className="text-white text-xl font-semibold font-mono">€{data.value.toLocaleString()}</p>
      <div className="flex items-center gap-2 mt-2">
        <div className="h-1 flex-1 bg-zinc-800 rounded-full overflow-hidden">
          <div className="h-full bg-emerald-500 rounded-full" style={{ width: `${data.percent}%` }} />
        </div>
        <span className="text-zinc-500 text-xs font-mono">{data.percent}%</span>
      </div>
    </div>
  );
}

export default function DataVizPage() {
  const emergencyPercent = Math.min(
    (financeData.emergency.current / financeData.emergency.target) * 100,
    100
  );

  return (
    <div className="min-h-screen bg-[#050508] text-white overflow-hidden">
      {/* Background gradient mesh */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-emerald-500/5 rounded-full blur-3xl" />
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-blue-500/5 rounded-full blur-3xl" />
      </div>

      <div className="relative max-w-7xl mx-auto px-6 py-12">
        {/* Header */}
        <div className="mb-12">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 bg-emerald-500/10 rounded-xl">
              <Activity className="w-5 h-5 text-emerald-400" />
            </div>
            <span className="text-xs font-medium text-zinc-500 uppercase tracking-[0.2em]">Financial Overview</span>
          </div>
          <h1 className="text-4xl font-light text-white tracking-tight">
            Portfolio <span className="font-semibold bg-gradient-to-r from-emerald-400 to-blue-400 bg-clip-text text-transparent">Dashboard</span>
          </h1>
          <p className="text-zinc-500 mt-2 text-sm">Real-time snapshot of your net worth and allocations</p>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <SummaryCard
            title="Net Worth"
            value={`€${financeData.summary.netWorth.toLocaleString()}`}
            subtitle={`+${financeData.summary.growthSinceApr2025}% since Apr 2025`}
            icon={TrendingUp}
            trend="up"
          />
          <SummaryCard
            title="Liquid Cash"
            value={`€${financeData.summary.liquidCash.toLocaleString()}`}
            subtitle="Bank + N26 + Reserve"
            icon={Wallet}
          />
          <SummaryCard
            title="Investments"
            value={`€${financeData.summary.investments.toLocaleString()}`}
            subtitle="BTC + Degiro + Crypto"
            icon={PiggyBank}
          />
          <SummaryCard
            title="Monthly Surplus"
            value={`€${financeData.summary.monthlySurplus}`}
            subtitle="BMW freed budget"
            icon={ArrowUpRight}
          />
        </div>

        {/* Charts Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          {/* Asset Allocation */}
          <GlowCard>
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-sm font-medium text-zinc-400 uppercase tracking-wider">Asset Allocation</h3>
                <span className="text-xs text-zinc-600 font-mono">7 assets</span>
              </div>
              <div className="flex justify-center">
                <PieChart width={320} height={280}>
                  <Pie
                    data={financeData.allocation}
                    cx={160}
                    cy={130}
                    innerRadius={55}
                    outerRadius={95}
                    paddingAngle={3}
                    dataKey="value"
                    stroke="none"
                  >
                    {financeData.allocation.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip content={<AllocationTooltip />} />
                  <Legend
                    verticalAlign="bottom"
                    height={36}
                    formatter={(value: string) => <span className="text-zinc-400 text-xs">{value}</span>}
                  />
                </PieChart>
              </div>
            </div>
          </GlowCard>

          {/* Account Balances */}
          <GlowCard>
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-sm font-medium text-zinc-400 uppercase tracking-wider">Account Balances</h3>
                <span className="text-xs text-zinc-600 font-mono">EUR</span>
              </div>
              <BarChart width={480} height={280} data={financeData.accounts} layout="vertical" margin={{ left: 10, right: 20 }}>
                <XAxis type="number" tickFormatter={(v) => `€${(v / 1000).toFixed(0)}k`} stroke="#27272a" tick={{ fill: '#52525b', fontSize: 11 }} />
                <YAxis type="category" dataKey="name" width={100} stroke="transparent" tick={{ fill: '#a1a1aa', fontSize: 12 }} />
                <Tooltip content={<CustomTooltip />} />
                <Bar dataKey="value" radius={[0, 6, 6, 0]} barSize={20}>
                  {financeData.accounts.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} fillOpacity={0.9} />
                  ))}
                </Bar>
              </BarChart>
            </div>
          </GlowCard>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Net Worth Growth */}
          <GlowCard>
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-sm font-medium text-zinc-400 uppercase tracking-wider">Net Worth Growth</h3>
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse" />
                  <span className="text-xs text-emerald-400 font-mono">+107%</span>
                </div>
              </div>
              <LineChart width={480} height={280} data={financeData.growth} margin={{ top: 5, right: 20, left: 10, bottom: 5 }}>
                <defs>
                  <linearGradient id="lineGradient" x1="0" y1="0" x2="1" y2="0">
                    <stop offset="0%" stopColor="#10b981" />
                    <stop offset="100%" stopColor="#3b82f6" />
                  </linearGradient>
                  <linearGradient id="areaGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#10b981" stopOpacity={0.2} />
                    <stop offset="100%" stopColor="#10b981" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <XAxis dataKey="date" stroke="#27272a" tick={{ fill: '#52525b', fontSize: 11 }} />
                <YAxis tickFormatter={(v) => `€${(v / 1000).toFixed(0)}k`} stroke="#27272a" tick={{ fill: '#52525b', fontSize: 11 }} />
                <Tooltip content={<CustomTooltip />} />
                <Line
                  type="monotone"
                  dataKey="value"
                  stroke="url(#lineGradient)"
                  strokeWidth={3}
                  dot={{ fill: '#10b981', strokeWidth: 0, r: 5 }}
                  activeDot={{ r: 7, fill: '#10b981', stroke: '#050508', strokeWidth: 3 }}
                />
              </LineChart>
            </div>
          </GlowCard>

          {/* Emergency Fund */}
          <GlowCard>
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-sm font-medium text-zinc-400 uppercase tracking-wider">Emergency Fund</h3>
                <span className="text-xs text-emerald-400 font-mono bg-emerald-500/10 px-2 py-1 rounded">TARGET MET</span>
              </div>
              <div className="flex flex-col items-center justify-center py-8">
                <div className="relative">
                  <svg width="220" height="130" viewBox="0 0 220 130">
                    <defs>
                      <linearGradient id="gaugeGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                        <stop offset="0%" stopColor="#10b981" />
                        <stop offset="50%" stopColor="#3b82f6" />
                        <stop offset="100%" stopColor="#8b5cf6" />
                      </linearGradient>
                      <filter id="glow">
                        <feGaussianBlur stdDeviation="3" result="coloredBlur"/>
                        <feMerge>
                          <feMergeNode in="coloredBlur"/>
                          <feMergeNode in="SourceGraphic"/>
                        </feMerge>
                      </filter>
                    </defs>
                    <path
                      d="M 20 110 A 90 90 0 0 1 200 110"
                      fill="none"
                      stroke="#18181b"
                      strokeWidth="14"
                      strokeLinecap="round"
                    />
                    <path
                      d="M 20 110 A 90 90 0 0 1 200 110"
                      fill="none"
                      stroke="url(#gaugeGradient)"
                      strokeWidth="14"
                      strokeLinecap="round"
                      strokeDasharray={`${(emergencyPercent / 100) * 282.6} 282.6`}
                      filter="url(#glow)"
                    />
                  </svg>
                  <div className="absolute inset-0 flex flex-col items-center justify-end pb-4">
                    <span className="text-4xl font-light text-white font-mono">{emergencyPercent.toFixed(0)}<span className="text-lg text-zinc-500">%</span></span>
                  </div>
                </div>
                <div className="mt-6 text-center">
                  <div className="text-2xl font-light text-white font-mono mb-1">
                    €{financeData.emergency.current.toLocaleString()}
                  </div>
                  <div className="text-xs text-zinc-500">
                    of €{financeData.emergency.target.toLocaleString()} target
                  </div>
                  <div className="mt-3 text-xs text-emerald-400/80 font-mono">
                    +€{(financeData.emergency.current - financeData.emergency.target).toLocaleString()} buffer
                  </div>
                </div>
              </div>
            </div>
          </GlowCard>
        </div>

        {/* Saving Pots */}
        <div className="mt-6">
          <GlowCard>
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                  <Landmark className="w-4 h-4 text-zinc-400" />
                  <h3 className="text-sm font-medium text-zinc-400 uppercase tracking-wider">Saving Pots</h3>
                </div>
                <span className="text-xs text-zinc-600 font-mono">6 buckets</span>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {financeData.savingPots.map((pot) => {
                  const percent = pot.value > 0 ? Math.min((pot.current / pot.value) * 100, 100) : 0;
                  const isFull = percent >= 100;
                  return (
                    <div key={pot.name} className="bg-[#0f0f15] border border-white/5 rounded-xl p-4 hover:border-white/10 transition-colors">
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-2">
                          <span className="text-lg">{pot.icon}</span>
                          <span className="text-sm text-zinc-300 font-medium">{pot.name}</span>
                        </div>
                        {isFull ? (
                          <span className="text-[10px] text-emerald-400 font-mono bg-emerald-500/10 px-2 py-0.5 rounded">FULL</span>
                        ) : pot.freq ? (
                          <span className="text-[10px] text-zinc-500 font-mono">{pot.freq}</span>
                        ) : null}
                      </div>
                      <div className="flex items-baseline gap-2 mb-2">
                        <span className="text-xl font-mono text-white">€{pot.current.toLocaleString()}</span>
                        <span className="text-xs text-zinc-600 font-mono">/ €{pot.value.toLocaleString()}</span>
                      </div>
                      <div className="h-1.5 bg-zinc-800 rounded-full overflow-hidden">
                        <div
                          className="h-full rounded-full transition-all duration-500"
                          style={{
                            width: `${percent}%`,
                            background: `linear-gradient(90deg, ${pot.color}, ${pot.color}88)`
                          }}
                        />
                      </div>
                      {pot.note && (
                        <div className="mt-2 text-[10px] text-zinc-600">{pot.note}</div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          </GlowCard>
        </div>

        {/* Footer */}
        <div className="mt-12 text-center">
          <div className="inline-flex items-center gap-2 text-zinc-600 text-xs">
            <div className="w-1.5 h-1.5 bg-zinc-700 rounded-full" />
            Data from financas.md • Last sync July 18, 2026
          </div>
        </div>
      </div>
      <VersionBadge projectName="data-viz" />
    </div>
  );
}
