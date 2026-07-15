"use client";

import { TrendingUp } from 'lucide-react';
import { useState, useEffect } from 'react';
import { Area, AreaChart, ReferenceLine, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';

interface EquityChartProps {
  data: { trade: string; equity: number }[];
}

function ChartTooltipContent({ active, payload, label }: any) {
  if (!active || !payload?.length) return null;
  const value = payload[0].value;
  return (
    <div className="bg-[#0d1117] border border-white/10 px-3 py-2 text-xs shadow-xl">
      <div className="text-white/40 mb-1">{label}</div>
      <div className="font-bold font-mono text-violet-400">
        {value >= 0 ? '+' : ''}{value.toFixed(2)} EUR
      </div>
    </div>
  );
}

export default function EquityChart({ data }: EquityChartProps) {
  const [hasInitialized, setHasInitialized] = useState(false);

  useEffect(() => {
    if (!hasInitialized && data.length > 0) {
      setHasInitialized(true);
    }
  }, [data, hasInitialized]);

  return (
    <div className="bg-white/[0.02] border border-white/[0.05] flex flex-col min-h-0 rounded h-full">
      <div className="flex items-center justify-between px-3 py-1 border-b border-white/[0.05] shrink-0">
        <div className="flex items-center gap-1">
          <TrendingUp className="w-3 h-3 text-violet-400/40" />
          <h2 className="text-[10px] font-semibold text-white/50 tracking-wide">Equity Curve</h2>
        </div>
        {data.length > 0 && (
          <span className={`text-[9px] font-mono font-bold ${data[data.length - 1]?.equity >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
            {data[data.length - 1]?.equity >= 0 ? '+' : ''}{data[data.length - 1]?.equity.toFixed(2)}
          </span>
        )}
      </div>

      <div className="relative flex-1 min-h-0 p-2">
        {data.length === 0 ? (
          <div className="flex items-center justify-center h-full text-white/20 text-xs">No data yet</div>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={data} margin={{ top: 4, right: 4, bottom: 0, left: -20 }}>
              <defs>
                <linearGradient id="xmEquityGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="rgba(139,92,246,0.4)" />
                  <stop offset="100%" stopColor="rgba(139,92,246,0)" />
                </linearGradient>
              </defs>
              <XAxis dataKey="trade" tick={{ fill: 'rgba(255,255,255,0.2)', fontSize: 9 }} axisLine={{ stroke: 'rgba(255,255,255,0.06)' }} tickLine={false} />
              <YAxis tick={{ fill: 'rgba(255,255,255,0.2)', fontSize: 9 }} axisLine={false} tickLine={false} />
              <Tooltip content={<ChartTooltipContent />} />
              <ReferenceLine y={0} stroke="rgba(255,255,255,0.1)" strokeDasharray="3 3" />
              <Area
                type="linear"
                dataKey="equity"
                stroke="rgba(139,92,246,0.9)"
                strokeWidth={1.5}
                fill="url(#xmEquityGradient)"
                dot={{ fill: 'rgba(139,92,246,0.8)', r: 1 }}
                activeDot={{ r: 1.5, fill: 'rgba(139,92,246,1)' }}
              />
            </AreaChart>
          </ResponsiveContainer>
        )}
      </div>
    </div>
  );
}
