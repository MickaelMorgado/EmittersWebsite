"use client";

import { useEffect, useRef, useState } from 'react';
import type { OHLCBar } from '@/app/api/trading-bot/ohlc/route';

// ── Layout constants ────────────────────────────────────────────────────────
const VW = 800;
const VH = 270;
const PAD = { top: 6, right: 52, bottom: 20, left: 2 };
const CW = VW - PAD.left - PAD.right;
const CH = VH - PAD.top  - PAD.bottom;

function p2y(price: number, lo: number, hi: number) {
  return PAD.top + CH - ((price - lo) / (hi - lo)) * CH;
}
function b2x(i: number, n: number) {
  return PAD.left + (i + 0.5) * (CW / n);
}
function fmt(p: number) {
  return p >= 10000
    ? p.toLocaleString('en-US', { maximumFractionDigits: 0 })
    : p.toFixed(2);
}

interface Props {
  crossoverStatus?: 'UP' | 'DOWN' | 'NONE';
}

export default function MiniOHLCChart({ crossoverStatus }: Props) {
  const [bars, setBars]       = useState<OHLCBar[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState<string | null>(null);
  const timerRef              = useRef<ReturnType<typeof setInterval> | null>(null);

  const fetch60 = async () => {
    try {
      const res = await fetch('/api/trading-bot/ohlc?limit=60');
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      if (data.bars?.length) { setBars(data.bars); setError(null); }
    } catch (_e: any) {
      setError('Chart unavailable');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetch60();
    timerRef.current = setInterval(fetch60, 15_000);
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, []);

  if (loading) return (
    <div className="h-[120px] flex items-center justify-center text-[10px] text-white/20 font-mono animate-pulse">
      Loading chart…
    </div>
  );
  if (error || !bars.length) return (
    <div className="h-[120px] flex items-center justify-center text-[10px] text-white/20 font-mono">
      {error ?? 'No data'}
    </div>
  );

  const N = bars.length;
  const livePrice = bars[N - 1].close;

  // ── Price range (include all MA values for auto-scale) ───────────────────
  const allVals = bars.flatMap(b =>
    [b.high, b.low, b.ma9, b.ma21, b.ma50].filter((v): v is number => v !== null)
  );
  const rawLo = Math.min(...allVals);
  const rawHi = Math.max(...allVals);
  const margin = (rawHi - rawLo) * 0.07;
  const lo = rawLo - margin;
  const hi = rawHi + margin;

  const barW  = CW / N;
  const bodyW = Math.max(1, barW * 0.55);

  // MA polylines helper
  const maLine = (key: 'ma9' | 'ma21' | 'ma50') =>
    bars.map((b, i) =>
      b[key] !== null ? `${b2x(i, N).toFixed(1)},${p2y(b[key]!, lo, hi).toFixed(1)}` : null
    ).filter(Boolean).join(' ');

  const livePY   = p2y(livePrice, lo, hi);
  const lastX    = b2x(N - 1, N);
  const lastBar  = bars[N - 1];
  const markerY  = crossoverStatus === 'UP'
    ? p2y(lastBar.low, lo, hi) + 10
    : p2y(lastBar.high, lo, hi) - 10;

  return (
    <div className="w-full mt-1">
      <svg
        viewBox={`0 0 ${VW} ${VH}`}
        preserveAspectRatio="xMidYMid meet"
        className="w-full"
        style={{ height: 'auto', maxHeight: 100 }}
      >
        {/* ── Subtle grid ── */}
        {[0, 0.33, 0.67, 1].map(t => {
          const y = PAD.top + t * CH;
          const p = hi - t * (hi - lo);
          return (
            <g key={t}>
              <line x1={PAD.left} y1={y} x2={VW - PAD.right} y2={y}
                stroke="rgba(255,255,255,0.04)" strokeWidth="0.5" />
              <text x={VW - PAD.right + 3} y={y + 3.5}
                fontSize="8" fill="rgba(255,255,255,0.2)" fontFamily="monospace">
                {fmt(p)}
              </text>
            </g>
          );
        })}

        {/* ── Candles ── */}
        {bars.map((b, i) => {
          const x   = b2x(i, N);
          const yO  = p2y(b.open,  lo, hi);
          const yC  = p2y(b.close, lo, hi);
          const yH  = p2y(b.high,  lo, hi);
          const yL  = p2y(b.low,   lo, hi);
          const bull  = b.close >= b.open;
          const col   = bull ? '#34d399' : '#f87171';
          const bodyY = Math.min(yO, yC);
          const bodyH = Math.max(0.8, Math.abs(yC - yO));
          return (
            <g key={b.time}>
              <line x1={x} y1={yH} x2={x} y2={yL}
                stroke={col} strokeWidth="0.7" opacity="0.6" />
              <rect x={x - bodyW / 2} y={bodyY} width={bodyW} height={bodyH}
                fill={bull ? 'rgba(52,211,153,0.8)' : 'rgba(248,113,113,0.8)'} />
            </g>
          );
        })}

        {/* ── MA lines: MA50 underneath, then MA21, MA9 on top ── */}
        <polyline points={maLine('ma50')} fill="none"
          stroke="rgba(251,146,60,0.75)" strokeWidth="1.3" strokeLinejoin="round" />
        <polyline points={maLine('ma21')} fill="none"
          stroke="rgba(250,204,21,0.75)" strokeWidth="1.1" strokeLinejoin="round" />
        <polyline points={maLine('ma9')} fill="none"
          stroke="rgba(34,211,238,0.85)" strokeWidth="1.1" strokeLinejoin="round" />

        {/* ── Live price dashed line + label ── */}
        <line x1={PAD.left} y1={livePY} x2={VW - PAD.right} y2={livePY}
          stroke="rgba(255,255,255,0.3)" strokeWidth="0.6" strokeDasharray="3 2" />
        <rect x={VW - PAD.right + 1} y={livePY - 5.5}
          width={PAD.right - 2} height={11} rx="2"
          fill="rgba(255,255,255,0.1)" />
        <text x={VW - PAD.right + 4} y={livePY + 3.5}
          fontSize="8.5" fill="rgba(255,255,255,0.85)" fontFamily="monospace" fontWeight="bold">
          {fmt(livePrice)}
        </text>

        {/* ── Crossover marker ── */}
        {crossoverStatus && crossoverStatus !== 'NONE' && (
          <g>
            <circle cx={lastX} cy={markerY} r="5"
              fill={crossoverStatus === 'UP' ? 'rgba(52,211,153,0.95)' : 'rgba(248,113,113,0.95)'}
              stroke="rgba(0,0,0,0.3)" strokeWidth="0.8" />
            <text x={lastX} y={markerY + 3.5}
              fontSize="7" textAnchor="middle" fontFamily="monospace" fontWeight="bold"
              fill="rgba(0,0,0,0.8)">
              {crossoverStatus === 'UP' ? '▲' : '▼'}
            </text>
          </g>
        )}

        {/* ── Legend ── */}
        <g transform={`translate(${PAD.left + 4}, ${VH - 5})`}>
          {([
            ['MA9',  'rgba(34,211,238,0.9)'],
            ['MA21', 'rgba(250,204,21,0.9)'],
            ['MA50', 'rgba(251,146,60,0.9)'],
          ] as [string, string][]).map(([label, color], idx) => (
            <g key={label} transform={`translate(${idx * 42}, 0)`}>
              <line x1="0" y1="0" x2="10" y2="0" stroke={color} strokeWidth="1.5" />
              <text x="13" y="3.5" fontSize="8" fill="rgba(255,255,255,0.4)" fontFamily="monospace">
                {label}
              </text>
            </g>
          ))}
        </g>
      </svg>
    </div>
  );
}
