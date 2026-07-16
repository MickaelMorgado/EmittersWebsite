"use client";

import { Activity, ArrowDownRight, ArrowUpRight } from 'lucide-react';

interface XmTrade {
  id: string;
  type: string;
  price: number;
  volume: number;
  time: string;
  result?: 'WIN' | 'LOSS';
  pnl?: number;
  netProfit?: number;
}

interface TradeHistorySectionProps {
  history: XmTrade[];
}

export default function TradeHistorySection({ history }: TradeHistorySectionProps) {
  return (
    <div className="bg-white/[0.02] border border-white/[0.05] flex flex-col min-h-0 rounded h-full">
      <div className="flex items-center justify-between px-4 py-2 border-b border-white/[0.05] shrink-0">
        <div className="flex items-center gap-1.5">
          <Activity className="w-3 h-3 text-white/25" />
          <h2 className="text-xs font-semibold text-white/50 tracking-wide">Trade History</h2>
        </div>
        <span className="text-sm text-white/20 font-mono">{history.length}</span>
      </div>
      <div className="divide-y divide-white/[0.04] overflow-y-auto flex-1 min-h-0">
        {history.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-white/25">
            <Activity className="w-5 h-5 mb-1.5 opacity-50" />
            <p className="text-xs">No trades yet.</p>
          </div>
        ) : (
          history.slice(0, 30).map((trade, index) => (
            <div
              key={trade.id || index}
              className="flex items-center justify-between px-4 py-2 hover:bg-white/[0.02] transition-colors duration-200"
            >
              <div className="flex items-center gap-2">
                <div className={`flex items-center justify-center w-5 h-5 ${
                  trade.type === 'BUY' ? 'bg-emerald-500/10 text-emerald-400' : 'bg-red-500/10 text-red-400'
                }`}>
                  {trade.type === 'BUY' ? <ArrowUpRight className="w-2.5 h-2.5" /> : <ArrowDownRight className="w-2.5 h-2.5" />}
                </div>
                <div>
                  <div className="flex items-center gap-1">
                    <span className={`text-xs font-bold uppercase ${trade.type === 'BUY' ? 'text-emerald-400' : 'text-red-400'}`}>
                      {trade.type}
                    </span>
                    <span className="text-xs font-mono text-white/50">{trade.volume} lot</span>
                  </div>
                  <div className="text-[10px] text-white/30 font-mono">{trade.time}</div>
                </div>
              </div>
              <div className="flex items-center gap-1.5">
                <span className={`text-xs font-mono font-bold ${(trade.netProfit ?? 0) >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                  {(trade.netProfit ?? 0) >= 0 ? '+' : ''}{(trade.netProfit ?? 0).toFixed(2)}
                </span>
                {trade.result && (
                  <span className={`inline-flex items-center px-1 py-0.5 text-[10px] font-bold uppercase tracking-wider ${
                    trade.result === 'WIN'
                      ? 'bg-emerald-500/10 text-emerald-400 ring-1 ring-emerald-500/20'
                      : 'bg-red-500/10 text-red-400 ring-1 ring-red-500/20'
                  }`}>
                    {trade.result}
                  </span>
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
