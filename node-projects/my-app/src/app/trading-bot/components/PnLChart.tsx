"use client";

import { BarChart3, ZoomIn, ZoomOut, RotateCcw } from 'lucide-react';
import { Bar, BarChart, Cell, ReferenceLine, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { useState, useMemo, useEffect } from 'react';
import RangeZoomSlider from './RangeZoomSlider';

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
  // Same zoom/pan/range mechanism as EquityChart, kept in sync visually via
  // matching compact control styling — lets the user inspect the same trade
  // window across both charts independently.
  const [startIndex, setStartIndex] = useState(0);
  const [endIndex, setEndIndex] = useState(() => Math.max(data.length - 1, 0));
  const [hasInitialized, setHasInitialized] = useState(false);

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
    <div className="bg-white/[0.02] border border-white/[0.05] flex flex-col min-h-0 rounded">
      <div className="flex items-center px-3 py-1 border-b border-white/[0.05] shrink-0">
        <BarChart3 className="w-3 h-3 text-white/25 mr-1" />
        <h2 className="text-[10px] font-semibold text-white/40 tracking-wide">P&L</h2>
      </div>

      <div className="relative flex-1 min-h-0 p-2">
        {/* Floating toolbar — same hover-to-reveal corner overlay as the
            Equity chart, freeing up the header row's vertical space */}
        {data.length > 1 && (
          <div className="absolute top-1 right-1 z-20 flex items-center gap-1 px-1 py-0.5 rounded bg-[#0d1117]/70 backdrop-blur-sm border border-white/[0.06] opacity-0 hover:opacity-100 focus-within:opacity-100 transition-opacity">
            <div className="flex gap-0.5 shrink-0">
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

        {/* Range-zoom brush — full-height windowing mask over the plot area,
            styled to feel native to the chart rather than a floating control */}
        {data.length > 1 && (
          <div className="absolute inset-2 z-10">
            <RangeZoomSlider
              max={data.length}
              startIndex={startIndex}
              endIndex={endIndex}
              onChange={(s, e) => { setStartIndex(s); setEndIndex(e); }}
              color="rgba(248,113,113,0.8)"
            />
          </div>
        )}
        {data.length === 0 ? (
          <div className="flex items-center justify-center h-full text-white/20 text-[10px]">No data</div>
        ) : visibleData.length === 0 ? (
          <div className="flex items-center justify-center h-full text-white/20 text-[10px]">No data in range</div>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={visibleData} margin={{ top: 2, right: 2, bottom: 0, left: -25 }}>
              <XAxis dataKey="trade" tick={false} axisLine={{ stroke: 'rgba(255,255,255,0.06)' }} tickLine={false} />
              <YAxis tick={{ fill: 'rgba(255,255,255,0.15)', fontSize: 8 }} axisLine={false} tickLine={false} />
              <Tooltip content={<ChartTooltipContent />} cursor={{ fill: 'rgba(255,255,255,0.03)' }} />
              <ReferenceLine y={0} stroke="rgba(255,255,255,0.08)" />
              <Bar dataKey="pnl" radius={0}>
                {visibleData.map((entry, index) => (
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
