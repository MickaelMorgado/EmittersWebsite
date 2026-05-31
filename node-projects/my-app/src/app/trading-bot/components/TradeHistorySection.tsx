"use client";

import { Activity, ArrowDownRight, ArrowUpRight } from 'lucide-react';

interface Trade {
  id: string;
  type: string;
  price: number;
  openPrice?: number;
  lot: number;
  time: string;
  result?: 'WIN' | 'LOSS';
  pnl?: number;
  profit?: number;
  commission?: number;
  netProfit?: number;
  isOpen?: boolean;
}

interface TradeHistorySectionProps {
  history: Trade[];
}

export default function TradeHistorySection({ history }: TradeHistorySectionProps) {
  return (
    <div className="col-span-1 bg-white/[0.02] border border-white/[0.05] flex flex-col min-h-0 rounded h-full">
      <div className="flex items-center justify-between px-4 py-2 border-b border-white/[0.05] shrink-0">
        <div className="flex items-center gap-1.5">
          <Activity className="w-3 h-3 text-white/25" />
          <h2 className="text-[10px] font-semibold text-white/50 tracking-wide">History</h2>
        </div>
        <span className="text-[8px] text-white/20 font-mono">{history.length}</span>
      </div>
      <div className="divide-y divide-white/[0.04] overflow-y-auto flex-1 min-h-0">
        {history.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-white/25">
            <Activity className="w-5 h-5 mb-1.5 opacity-50" />
            <p className="text-[10px]">No closed trades yet.</p>
          </div>
        ) : (
          history.slice(-20).reverse().map((trade, index) => (
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
                    <span className={`text-[9px] font-bold uppercase ${trade.type === 'BUY' ? 'text-emerald-400' : 'text-red-400'}`}>
                      {trade.type}
                    </span>
                    <span className="text-[10px] font-mono text-white/70">
                      {trade.openPrice ? (
                        <>{trade.openPrice.toFixed(5)}<span className="text-white/20">&rarr;</span>{trade.price.toFixed(5)}</>
                      ) : trade.price.toFixed(5)}
                    </span>
                  </div>
                  <div className="text-[8px] text-white/20 font-mono">{trade.time}</div>
                </div>
              </div>
              <div className="flex items-center gap-1.5">
                {trade.netProfit !== undefined ? (
                  <div className="text-right">
                    <span className={`text-[10px] font-mono font-bold ${trade.netProfit >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                      {trade.netProfit >= 0 ? '+' : ''}{trade.netProfit.toFixed(2)}
                    </span>
                    {trade.commission !== undefined && Math.abs(trade.commission) > 0.001 && (
                      <div className="text-[8px] text-amber-400">
                        {trade.commission < 0 ? trade.commission.toFixed(2) : `-${trade.commission.toFixed(2)}`}
                      </div>
                    )}
                  </div>
                ) : trade.pnl !== undefined ? (
                  <span className={`text-[10px] font-mono font-bold ${trade.pnl >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                    {trade.pnl >= 0 ? '+' : ''}{trade.pnl.toFixed(2)}
                  </span>
                ) : null}
                {trade.result && (
                  <span className={`inline-flex items-center px-1 py-0.5 text-[7px] font-bold uppercase tracking-wider ${
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
