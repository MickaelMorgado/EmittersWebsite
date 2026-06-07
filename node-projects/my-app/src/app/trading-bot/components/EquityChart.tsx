"use client";

import { RotateCcw, TrendingUp, ZoomIn, ZoomOut } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { Area, AreaChart, ReferenceLine, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import RangeZoomSlider from './RangeZoomSlider';

interface EquityChartProps {
  data: { trade: string; equity: number }[];
}

function ChartTooltipContent({ active, payload, label }: any) {
  if (!active || !payload?.length) return null;
  const value = payload[0].value;
  return (
    <div className="bg-[#0d1117] border border-white/10 px-3 py-2 text-xs shadow-xl">
      <div className="text-white/40 mb-1">{label}</div>
      <div className="font-bold font-mono text-cyan-400">
        {value >= 0 ? '+' : ''}{value.toFixed(2)} USD
      </div>
    </div>
  );
}

export default function EquityChart({ data }: EquityChartProps) {
  const [startIndex, setStartIndex] = useState(0);
  const [endIndex, setEndIndex] = useState(() => Math.max(data.length - 1, 0));
  const [hasInitialized, setHasInitialized] = useState(false);

  // Data often arrives asynchronously after mount — once it does, snap the
  // view to the full history (same as "Reset View") instead of staying at
  // whatever the initial empty-state range was.
  useEffect(() => {
    if (!hasInitialized && data.length > 0) {
      setStartIndex(0);
      setEndIndex(data.length - 1);
      setHasInitialized(true);
    }
  }, [data, hasInitialized]);

  const visibleData = useMemo(() => {
    if (data.length === 0) return [];
    return data.slice(startIndex, endIndex + 1);
  }, [data, startIndex, endIndex]);

  const handleZoomIn = () => {
    const range = endIndex - startIndex;
    const newRange = Math.max(Math.floor(range / 2), 1);
    const mid = startIndex + range / 2;
    setStartIndex(Math.max(0, Math.floor(mid - newRange / 2)));
    setEndIndex(Math.min(data.length - 1, Math.ceil(mid + newRange / 2)));
  };

  const handleZoomOut = () => {
    const range = endIndex - startIndex;
    const newRange = Math.min(Math.floor(range * 2), data.length - 1);
    const mid = startIndex + range / 2;
    setStartIndex(Math.max(0, Math.floor(mid - newRange / 2)));
    setEndIndex(Math.min(data.length - 1, Math.ceil(mid + newRange / 2)));
  };

  const handleReset = () => {
    setStartIndex(0);
    setEndIndex(data.length - 1);
  };

  const handlePanLeft = () => {
    const range = endIndex - startIndex;
    const step = Math.max(Math.floor(range / 10), 1);
    setStartIndex(Math.max(0, startIndex - step));
    setEndIndex(Math.max(range, endIndex - step));
  };

  const handlePanRight = () => {
    const range = endIndex - startIndex;
    const step = Math.max(Math.floor(range / 10), 1);
    setStartIndex(Math.min(data.length - range - 1, startIndex + step));
    setEndIndex(Math.min(data.length - 1, endIndex + step));
  };

  return (
    <div className="bg-white/[0.02] border border-white/[0.05] flex flex-col min-h-0 rounded h-full">
      <div className="flex items-center justify-between px-3 py-1 border-b border-white/[0.05] shrink-0">
        <div className="flex items-center gap-1">
          <TrendingUp className="w-3 h-3 text-cyan-400/40" />
          <h2 className="text-[10px] font-semibold text-white/50 tracking-wide">Equity</h2>
        </div>
        {data.length > 0 && (
          <span className={`text-[9px] font-mono font-bold ${data[data.length - 1]?.equity >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
            {data[data.length - 1]?.equity >= 0 ? '+' : ''}{data[data.length - 1]?.equity.toFixed(2)}
          </span>
        )}
      </div>

      <div className="relative flex-1 min-h-0 p-2">
        {/* Floating toolbar — nav buttons + position readout, overlaid in the
            corner instead of consuming a dedicated header row. Appears on
            hover so the chart stays clean at rest and reclaims that vertical
            space; the range-zoom brush below remains the primary control. */}
        {data.length > 1 && (
          <div className="absolute top-1 right-1 z-20 flex items-center gap-1 px-1 py-0.5 rounded bg-[#0d1117]/70 backdrop-blur-sm border border-white/[0.06] opacity-0 hover:opacity-100 focus-within:opacity-100 transition-opacity">
            <div className="flex gap-1 shrink-0">
              <button
                onClick={handlePanLeft}
                disabled={startIndex === 0}
                className="p-0.5 hover:bg-white/[0.08] disabled:opacity-30 disabled:cursor-not-allowed rounded transition-colors"
                title="Pan left"
              >
                <span className="text-[10px] text-white/50 leading-none">←</span>
              </button>
              <button
                onClick={handleZoomIn}
                className="p-0.5 hover:bg-white/[0.08] rounded transition-colors"
                title="Zoom in"
              >
                <ZoomIn className="w-2.5 h-2.5 text-white/50" />
              </button>
              <button
                onClick={handleZoomOut}
                disabled={endIndex - startIndex >= data.length - 1}
                className="p-0.5 hover:bg-white/[0.08] disabled:opacity-30 disabled:cursor-not-allowed rounded transition-colors"
                title="Zoom out"
              >
                <ZoomOut className="w-2.5 h-2.5 text-white/50" />
              </button>
              <button
                onClick={handleReset}
                className="p-0.5 hover:bg-white/[0.08] rounded transition-colors"
                title="Reset view"
              >
                <RotateCcw className="w-2.5 h-2.5 text-white/50" />
              </button>
              <button
                onClick={handlePanRight}
                disabled={endIndex === data.length - 1}
                className="p-0.5 hover:bg-white/[0.08] disabled:opacity-30 disabled:cursor-not-allowed rounded transition-colors"
                title="Pan right"
              >
                <span className="text-[10px] text-white/50 leading-none">→</span>
              </button>
            </div>
            <span className="text-[9px] text-white/40 font-mono whitespace-nowrap pl-1 border-l border-white/[0.08]">
              {startIndex + 1}-{endIndex + 1}/{data.length}
            </span>
          </div>
        )}

        {/* Range-zoom brush — a full-height windowing mask over the chart's
            plot area itself (TradingView-style), not a separate floating bar.
            Drag the clear window to pan, or its edge-rails to resize/zoom. */}
        {data.length > 1 && (
          <div className="absolute inset-2 z-10">
            <RangeZoomSlider
              max={data.length}
              startIndex={startIndex}
              endIndex={endIndex}
              onChange={(s, e) => { setStartIndex(s); setEndIndex(e); }}
              color="rgba(34,211,238,0.8)"
            />
          </div>
        )}
        {data.length === 0 ? (
          <div className="flex items-center justify-center h-full text-white/20 text-xs">No data yet</div>
        ) : visibleData.length === 0 ? (
          <div className="flex items-center justify-center h-full text-white/20 text-xs">No data in range</div>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={visibleData} margin={{ top: 4, right: 4, bottom: 0, left: -20 }}>
              <defs>
                <linearGradient id="equityGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="rgba(34,211,238,0.4)" />
                  <stop offset="100%" stopColor="rgba(34,211,238,0)" />
                </linearGradient>
              </defs>
              <XAxis dataKey="trade" tick={{ fill: 'rgba(255,255,255,0.2)', fontSize: 9 }} axisLine={{ stroke: 'rgba(255,255,255,0.06)' }} tickLine={false} />
              <YAxis tick={{ fill: 'rgba(255,255,255,0.2)', fontSize: 9 }} axisLine={false} tickLine={false} />
              <Tooltip content={<ChartTooltipContent />} />
              <ReferenceLine y={0} stroke="rgba(255,255,255,0.1)" strokeDasharray="3 3" />
              <Area
                type="linear"
                dataKey="equity"
                stroke="rgba(34,211,238,0.9)"
                strokeWidth={1.5}
                fill="url(#equityGradient)"
                dot={{ fill: 'rgba(34,211,238,0.8)', r: 1 }}
                activeDot={{ r: 1.5, fill: 'rgba(34,211,238,1)' }}
              />
            </AreaChart>
          </ResponsiveContainer>
        )}
      </div>
    </div>
  );
}
