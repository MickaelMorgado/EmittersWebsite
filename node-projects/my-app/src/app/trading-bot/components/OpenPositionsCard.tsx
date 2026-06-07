"use client";

import { Activity } from 'lucide-react';

interface Trade {
  id: string;
  type: string;
  price: number;
  openPrice?: number;
  stopLoss?: number;
  takeProfit?: number;
  lot: number;
  time: string;
  result?: 'WIN' | 'LOSS';
  pnl?: number;
  profit?: number;
  commission?: number;
  netProfit?: number;
  isOpen?: boolean;
}

interface OpenPositionsCardProps {
  openPositions: Trade[];
  floatingPnL: { [key: string]: number };
  newPositionIds: Set<string>;
}

function AnimatedNumber({ value, className }: { value: number; className: string }) {
  return (
    <span className={className}>
      {value >= 0 ? '+' : ''}{value.toFixed(2)}
    </span>
  );
}

export default function OpenPositionsCard({
  openPositions,
  floatingPnL,
  newPositionIds,
}: OpenPositionsCardProps) {
  return (
    <div className="bg-white/[0.03] border border-cyan-500/[0.1] p-3 flex-1 min-h-0 h-full rounded">
      <style>{`
        @keyframes slideInGlow {
          from {
            opacity: 0;
            transform: translateX(-10px);
            box-shadow: 0 0 20px rgba(34, 211, 238, 0.8);
          }
          to {
            opacity: 1;
            transform: translateX(0);
            box-shadow: 0 0 0 rgba(34, 211, 238, 0);
          }
        }
        @keyframes pnlPulse {
          0% {
            transform: scale(1);
            filter: drop-shadow(0 0 0px currentColor);
          }
          50% {
            transform: scale(1.05);
            filter: drop-shadow(0 0 8px currentColor);
          }
          100% {
            transform: scale(1);
            filter: drop-shadow(0 0 0px currentColor);
          }
        }
        .position-new {
          animation: slideInGlow 0.5s ease-out;
        }
        .pnl-value {
          transition: all 0.4s cubic-bezier(0.34, 1.56, 0.64, 1);
          font-variant-numeric: tabular-nums;
        }
        .pnl-update {
          animation: pnlPulse 0.6s ease-out;
        }
      `}</style>
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <Activity className="w-3 h-3 text-cyan-400/60" />
          <span className="text-xs font-bold text-cyan-300/80 uppercase tracking-wider">Open Positions</span>
        </div>
        <span className="text-xs text-cyan-400/40 font-mono">{openPositions.length} active</span>
      </div>
      {openPositions.length === 0 ? (
        <div className="flex items-center justify-center py-4 text-xs text-white/30 font-mono">
          No open positions
        </div>
      ) : (
      <div className="space-y-1 overflow-y-auto max-h-28">
        {openPositions.map((pos: Trade, i: number) => {
          const isNew = newPositionIds.has(pos.id);
          const pnl = floatingPnL[pos.id] || 0;
          const pnlColor = pnl >= 0 ? 'text-emerald-400' : 'text-red-400';
          return (
            <div
              key={pos.id || i}
              className={`flex items-center justify-between py-1.5 px-2 border border-cyan-500/[0.1] rounded transition-all ${
                isNew ? 'position-new bg-cyan-500/10' : 'border-white/[0.04]'
              } last:border-0`}
            >
              <div className="flex items-center gap-2 flex-1">
                <span className={`text-xs font-bold ${pos.type === 'BUY' ? 'text-emerald-400' : 'text-red-400'}`}>
                  {pos.type}
                </span>
                <div className="flex flex-col flex-1">
                  <span className="text-sm font-mono text-white/70">{pos.price.toFixed(5)} @ {pos.lot.toFixed(2)} lot</span>
                  <span className="text-sm text-white/40 font-mono">
                    {pos.time} | SL: {pos.stopLoss?.toFixed(5) || 'N/A'} TP: {pos.takeProfit?.toFixed(5) || 'N/A'}
                  </span>
                </div>
              </div>
              <div className="text-right">
                <AnimatedNumber
                  value={pnl}
                  className={`text-xs font-mono font-bold transition-colors duration-300 ${pnlColor}`}
                />
                <div className="text-sm text-white/30">Floating</div>
              </div>
            </div>
          );
        })}
      </div>
      )}
    </div>
  );
}
