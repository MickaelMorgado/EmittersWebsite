"use client";

import { BarChart3 } from 'lucide-react';
import { Bar, BarChart, Cell, ReferenceLine, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';

interface PnLChartProps {
  data: { trade: string; pnl: number }[];
}

function ChartTooltipContent({ active, payload, label }: { active?: boolean; payload?: Array<{ value: number }>; label?: string }) {
  if (!active || !payload?.length) return null;
  const value = payload[0].value;
  return (
    <div className="bg-[#0d1117] border border-white/10 px-3 py-2 text-xs shadow-xl">
      <div className="text-white/40 mb-1">{label}</div>
      <div className={`font-bold font-mono ${value >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
        {value >= 0 ? '+' : ''}{value.toFixed(2)} USD
      </div>
    </div>
  );
}

export default function PnLChart({ data }: PnLChartProps) {
  return (
    <div className="bg-white/[0.02] border border-white/[0.05] flex flex-col min-h-0 rounded">
      <div className="flex items-center px-3 py-1 border-b border-white/[0.05] shrink-0">
        <BarChart3 className="w-3 h-3 text-white/25 mr-1" />
        <h2 className="text-[10px] font-semibold text-white/40 tracking-wide">P&L</h2>
      </div>
      <div className="flex-1 min-h-0 px-1 py-1">
        {data.length === 0 ? (
          <div className="flex items-center justify-center h-full text-white/20 text-[10px]">No data</div>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data} margin={{ top: 2, right: 2, bottom: 0, left: -25 }}>
              <XAxis dataKey="trade" tick={false} axisLine={{ stroke: 'rgba(255,255,255,0.06)' }} tickLine={false} />
              <YAxis tick={{ fill: 'rgba(255,255,255,0.15)', fontSize: 8 }} axisLine={false} tickLine={false} />
              <Tooltip content={<ChartTooltipContent />} cursor={{ fill: 'rgba(255,255,255,0.03)' }} />
              <ReferenceLine y={0} stroke="rgba(255,255,255,0.08)" />
              <Bar dataKey="pnl" radius={0}>
                {data.map((entry, index) => (
                  <Cell key={index} fill={entry.pnl >= 0 ? 'rgba(52,211,153,0.6)' : 'rgba(248,113,113,0.6)'} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        )}
      </div>
    </div>
  );
}
