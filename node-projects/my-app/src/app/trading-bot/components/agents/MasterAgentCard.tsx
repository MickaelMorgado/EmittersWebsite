"use client";

import { Bot } from 'lucide-react';
import { ReportMetrics, BotStats, SimulatedAgentOutput } from '../AIReportsSection';

interface MasterAgentCardProps {
  activeAgent: string | null;
  agentLastRun: { master: string };
  reports: ReportMetrics;
  stats: BotStats;
  simulatedAgents?: SimulatedAgentOutput | null;
  formatTimeAgo: (timestamp: string) => string;
}

function formatTimeAgo(timestamp: string): string {
  const now = new Date();
  const then = new Date(timestamp);
  const seconds = Math.floor((now.getTime() - then.getTime()) / 1000);

  if (seconds < 60) return `${seconds}s ago`;
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
  return `${Math.floor(seconds / 86400)}d ago`;
}

export default function MasterAgentCard({
  activeAgent,
  agentLastRun,
  reports,
  stats,
  simulatedAgents,
}: MasterAgentCardProps) {
  const calculateConfidence = () => {
    if (simulatedAgents) {
      return simulatedAgents.risk.score + simulatedAgents.trend.score + simulatedAgents.news.score + simulatedAgents.history.score;
    }
    const riskOk = reports.maxDrawdown <= stats.totalPnl * 0.5 ? 25 : 0;
    const trendOk = reports.longestWinStreak > 3 ? 25 : reports.longestLoseStreak > 3 ? 0 : 12;
    const newsOk = 25;
    const historyOk = stats.totalTrades > 100 ? 25 : stats.totalTrades > 50 ? 15 : 0;
    return riskOk + trendOk + newsOk + historyOk;
  };

  const getSignal = () => {
    const total = calculateConfidence();
    if (total < 75) {
      return 'NEUTRAL';
    } else if (simulatedAgents ? simulatedAgents.trend.direction === 'BUY' : reports.longestWinStreak > 3) {
      return 'BUY';
    } else if (simulatedAgents ? simulatedAgents.trend.direction === 'SELL' : reports.longestLoseStreak > 3) {
      return 'SELL';
    } else {
      return 'NEUTRAL';
    }
  };

  const getSignalColor = () => {
    const signal = getSignal();
    const total = calculateConfidence();
    if (total < 75) {
      return 'bg-white/10 text-white/40 ring-1 ring-white/10';
    } else if (signal === 'BUY') {
      return 'bg-emerald-500/20 text-emerald-400 ring-1 ring-emerald-500/20';
    } else if (signal === 'SELL') {
      return 'bg-red-500/20 text-red-400 ring-1 ring-red-500/20';
    } else {
      return 'bg-white/10 text-white/40 ring-1 ring-white/10';
    }
  };

  const total = calculateConfidence();

  return (
    <div className={`bg-gradient-to-br from-amber-500/[0.06] to-orange-500/[0.02] border border-amber-500/[0.08] p-3 rounded ${
      activeAgent === 'master' ? 'agent-active-master' : ''
    }`}>
      <div className="flex items-center justify-between gap-2 mb-2">
        <div className="flex items-center gap-2">
          <Bot className="w-3 h-3 text-amber-400/70" />
          <span className="text-[10px] font-bold text-amber-300/80 uppercase tracking-wider">Master</span>
          <span className="text-[8px] text-amber-400/50 font-mono">{formatTimeAgo(agentLastRun.master)}</span>
        </div>
        <span className={`text-xs font-bold px-2 py-0.5 ${getSignalColor()}`}>
          {getSignal()}
        </span>
      </div>

      {/* Decision Percentile */}
      <div className="mb-2.5">
        <div className="flex items-center justify-between mb-1">
          <span className="text-[8px] text-white/30 uppercase">Confidence Gate</span>
          <span className={`text-[10px] font-bold font-mono ${
            total >= 75 ? 'text-emerald-400' : total >= 50 ? 'text-yellow-400' : 'text-red-400'
          }`}>
            {total}%
          </span>
        </div>
        <div className="w-full h-1.5 bg-white/[0.05] rounded overflow-hidden border border-white/[0.08]">
          <div
            className={`h-full transition-all duration-300 ${
              total >= 75 ? 'bg-gradient-to-r from-emerald-500 to-emerald-400' : total >= 50 ? 'bg-gradient-to-r from-yellow-500 to-yellow-400' : 'bg-gradient-to-r from-red-500 to-red-400'
            }`}
            style={{ width: `${total}%` }}
          />
        </div>
      </div>

      {/* Risk/Reward Adjustment based on Trend */}
      <div className="mb-2 pt-2 border-t border-white/[0.05]">
        <div className="flex items-center justify-between mb-1">
          <span className="text-[8px] text-white/30 uppercase">Strategy Mode</span>
          <span className="text-[9px] font-mono text-emerald-400/70">
            {reports.longestWinStreak > 3 ? 'TRENDING+' : reports.longestLoseStreak > 3 ? 'TRENDING−' : 'STATIC'}
          </span>
        </div>
        <p className="text-[7px] text-white/50 mb-1.5">
          {reports.longestWinStreak > 3
            ? `Uptrend detected (${reports.longestWinStreak}W) → Trailing stops + Extended targets`
            : reports.longestLoseStreak > 3
            ? `Downtrend detected (${reports.longestLoseStreak}L) → Trailing stops + Moderate targets`
            : 'Neutral trend → Static risk/reward'}
        </p>
        <div className="flex items-center justify-between text-[7px]">
          <span className="text-white/30">Target R:R</span>
          <span className="font-mono font-bold text-white/60">
            {reports.longestWinStreak > 3
              ? `1:${(6 + Math.min(reports.longestWinStreak * 0.5, 3)).toFixed(0)} (1:9+)`
              : reports.longestLoseStreak > 3
              ? `1:${(3 + Math.min(reports.longestLoseStreak * 0.2, 2)).toFixed(1)}`
              : '1:1.5'}
          </span>
        </div>
        <div className="flex items-center justify-between text-[7px] mt-0.5">
          <span className="text-white/30">Position Size</span>
          <span className="font-mono font-bold text-white/60">
            {reports.longestWinStreak > 3 ? 'Aggressive (↑↑)' : reports.longestLoseStreak > 3 ? 'Conservative (↓)' : 'Standard (→)'}
          </span>
        </div>
      </div>

      <p className="text-[8px] leading-relaxed text-white/50">
        {total >= 75
          ? '✓ GATE OPEN: All agents aligned for execution'
          : total >= 50
          ? '⚠ GATE PARTIAL: Trade with adjusted risk/reward'
          : '✗ GATE CLOSED: Insufficient confidence'}
      </p>
    </div>
  );
}
