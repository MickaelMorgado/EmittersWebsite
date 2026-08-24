"use client";

import { FileText } from 'lucide-react';

interface ReportMetrics {
  bestTrade: number;
  worstTrade: number;
  avgWin: number;
  avgLoss: number;
  avgTrade: number;
  profitFactor: number;
  maxDrawdown: number;
  expectancy: number;
  longestWinStreak: number;
  longestLoseStreak: number;
  totalGrossProfit: number;
  totalGrossLoss: number;
  rr: number;
}

interface XmStats {
  totalTrades: number;
  wins: number;
  losses: number;
  winRate: number;
  totalPnl: number;
}

interface MetricsSectionProps {
  reports: ReportMetrics;
  stats: XmStats;
}

function ReportRow({ label, value, color }: { label: string; value: string; color?: string }) {
  return (
    <div className="flex items-center justify-between py-1.5 border-b border-white/[0.04] last:border-0">
      <span className="text-[10px] text-white/35 uppercase tracking-wider">{label}</span>
      <span className={`text-xs font-mono font-bold ${color || 'text-white/70'}`}>{value}</span>
    </div>
  );
}

export default function MetricsSection({ reports, stats }: MetricsSectionProps) {
  return (
    <div className="bg-white/[0.02] border border-white/[0.05] flex flex-col min-h-0 rounded h-full">
      <div className="flex items-center gap-1.5 px-4 py-2 border-b border-white/[0.05] shrink-0">
        <FileText className="w-3 h-3 text-white/25" />
        <h2 className="text-xs font-semibold text-white/50 tracking-wide">Metrics</h2>
      </div>
      <div className="overflow-y-auto flex-1 min-h-0 px-4 py-2">
        {stats.totalTrades === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-white/20">
            <FileText className="w-5 h-5 mb-1.5 opacity-40" />
            <p className="text-xs">Need trade data to generate reports.</p>
          </div>
        ) : (
          <div>
            <div className="mb-3">
              <span className="text-[10px] font-bold text-white/25 uppercase tracking-widest">Profitability</span>
              <div className="mt-1.5">
                <ReportRow label="Profit Factor" value={reports.profitFactor === Infinity ? '∞' : reports.profitFactor.toFixed(2)} color={reports.profitFactor >= 1 ? 'text-emerald-400' : 'text-red-400'} />
                <ReportRow label="Risk/Reward" value={reports.rr === Infinity ? '∞' : `1:${reports.rr.toFixed(2)}`} color={reports.rr >= 1 ? 'text-emerald-400' : 'text-red-400'} />
                <ReportRow label="Win / Loss" value={`${stats.winRate}% / ${(100 - stats.winRate).toFixed(1)}%`} color={stats.winRate >= 50 ? 'text-emerald-400' : 'text-red-400'} />
                <ReportRow label="Expectancy" value={`${reports.expectancy >= 0 ? '+' : ''}${reports.expectancy.toFixed(2)}`} color={reports.expectancy >= 0 ? 'text-emerald-400' : 'text-red-400'} />
                <ReportRow label="Avg Trade" value={`${reports.avgTrade >= 0 ? '+' : ''}${reports.avgTrade.toFixed(2)}`} color={reports.avgTrade >= 0 ? 'text-emerald-400' : 'text-red-400'} />
                <ReportRow label="Gross Profit" value={`+${reports.totalGrossProfit.toFixed(2)}`} color="text-emerald-400" />
                <ReportRow label="Gross Loss" value={`-${reports.totalGrossLoss.toFixed(2)}`} color="text-red-400" />
              </div>
            </div>

            <div className="mb-3">
              <span className="text-[10px] font-bold text-white/25 uppercase tracking-widest">Trade Analysis</span>
              <div className="mt-1.5">
                <ReportRow label="Best Trade" value={`+${reports.bestTrade.toFixed(2)}`} color="text-emerald-400" />
                <ReportRow label="Worst Trade" value={reports.worstTrade.toFixed(2)} color="text-red-400" />
                <ReportRow label="Avg Win" value={`+${reports.avgWin.toFixed(2)}`} color="text-emerald-400/70" />
                <ReportRow label="Avg Loss" value={`-${reports.avgLoss.toFixed(2)}`} color="text-red-400/70" />
              </div>
            </div>

            <div className="mb-3">
              <span className="text-[10px] font-bold text-white/25 uppercase tracking-widest">Risk</span>
              <div className="mt-1.5">
                <ReportRow label="Max Drawdown" value={`-${reports.maxDrawdown.toFixed(2)}`} color="text-red-400" />
                <ReportRow label="Best Streak" value={`${reports.longestWinStreak}W`} color="text-emerald-400/70" />
                <ReportRow label="Worst Streak" value={`${reports.longestLoseStreak}L`} color="text-red-400/70" />
              </div>
            </div>

            <div>
              <span className="text-[10px] font-bold text-white/25 uppercase tracking-widest">Summary</span>
              <div className="mt-1.5">
                <ReportRow label="Total Trades" value={String(stats.totalTrades)} />
                <ReportRow label="Wins / Losses" value={`${stats.wins} / ${stats.losses}`} />
                <ReportRow label="Win Rate" value={`${stats.winRate}%`} color={stats.winRate >= 50 ? 'text-emerald-400' : 'text-red-400'} />
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
