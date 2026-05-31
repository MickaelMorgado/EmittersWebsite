"use client";

import { Bot, Settings, FileText, TrendingUp, TrendingDown } from 'lucide-react';
import { ReportMetrics, BotStats, SimulatedAgentOutput } from '../AIReportsSection';

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

interface HistoryAgentCardProps {
  activeAgent: string | null;
  agentLastRun: { history: string };
  stats: BotStats;
  reports: ReportMetrics;
  simulatedAgents?: SimulatedAgentOutput | null;
  reportHistory: any;
  history?: Trade[];
  onRulesClick: () => void;
  onReportsClick: () => void;
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

export default function HistoryAgentCard({
  activeAgent,
  agentLastRun,
  stats,
  reports,
  simulatedAgents,
  reportHistory,
  history = [],
  onRulesClick,
  onReportsClick,
}: HistoryAgentCardProps) {
  // Calculate recent trade performance
  const recentTrades = history.slice(-5);
  const recentWins = recentTrades.filter(t => t.result === 'WIN').length;
  const recentLosses = recentTrades.filter(t => t.result === 'LOSS').length;
  const recentWinRate = recentTrades.length > 0 ? (recentWins / recentTrades.length * 100).toFixed(0) : '—';
  const totalRecentPnL = recentTrades.reduce((sum, t) => sum + (t.pnl || 0), 0);

  return (
    <div className={`bg-gradient-to-br from-emerald-500/[0.06] to-green-500/[0.02] border border-emerald-500/[0.1] p-2 group hover:border-emerald-500/[0.2] transition-colors rounded ${
      activeAgent === 'history' ? 'agent-active-history' : ''
    }`}>
      <div className="flex items-center justify-between gap-1.5 mb-1">
        <div className="flex items-center gap-1">
          <Bot className="agent-icon w-2.5 h-2.5 text-emerald-400/60" />
          <span className="agent-title text-[8px] font-bold text-emerald-300/80 uppercase tracking-wider">History</span>
          <span className="text-[7px] text-emerald-400/50 font-mono">{formatTimeAgo(agentLastRun.history)}</span>
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={onRulesClick}
            className="p-0.5 hover:bg-emerald-500/10 rounded opacity-0 group-hover:opacity-100 transition-opacity"
            title="View rules"
          >
            <Settings className="w-2.5 h-2.5 text-emerald-400/60" />
          </button>
          <button
            onClick={onReportsClick}
            className="p-0.5 hover:bg-emerald-500/10 rounded opacity-0 group-hover:opacity-100 transition-opacity"
            title="View reports"
          >
            <FileText className="w-2.5 h-2.5 text-emerald-400/60" />
          </button>
          <span className="text-[8px] font-bold text-emerald-400 font-mono">
            {simulatedAgents ? `${simulatedAgents.history.score}pts` : stats.totalTrades > 100 ? '25' : stats.totalTrades > 50 ? '15' : '0'}%
          </span>
        </div>
      </div>
      <div className="h-0.5 bg-white/[0.05] rounded overflow-hidden mb-1">
        <div
          className="progress-bar h-full bg-emerald-500"
          style={{
            width: `${
              stats.totalTrades > 100 ? 100 : stats.totalTrades > 50 ? 60 : 0
            }%`
          }}
        />
      </div>
      {/* Recent Trades Section */}
      {recentTrades.length > 0 && (
        <div className="mb-2 pb-2 border-b border-white/[0.05] space-y-1">
          <p className="text-[7px] text-white/40 font-medium uppercase">Last {recentTrades.length} Trades</p>
          <div className="space-y-0.5">
            {recentTrades.map((trade, idx) => (
              <div key={trade.id} className="flex items-center justify-between text-[7px] bg-white/[0.02] p-1 rounded">
                <div className="flex items-center gap-1">
                  {trade.result === 'WIN' ? (
                    <TrendingUp className="w-2 h-2 text-emerald-400" />
                  ) : (
                    <TrendingDown className="w-2 h-2 text-red-400" />
                  )}
                  <span className="text-white/60">{trade.type}</span>
                </div>
                <span className={`font-mono font-bold ${trade.pnl && trade.pnl > 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                  {trade.pnl ? (trade.pnl > 0 ? '+' : '') + trade.pnl.toFixed(2) : '—'}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Metrics Section */}
      <p className="text-[8px] leading-tight text-white/45 mb-2">
        {stats.totalTrades > 100 ? '📊 Excellent dataset' : stats.totalTrades > 50 ? '📋 Good data' : '⏳ Build more trades'}
      </p>

      <div className="text-[7px] space-y-0.5 border-t border-white/[0.05] pt-1">
        <div className="flex justify-between">
          <span className="text-white/30">Recent Win Rate</span>
          <span className={`font-mono font-bold ${recentWins > recentLosses ? 'text-emerald-400' : recentWins < recentLosses ? 'text-red-400' : 'text-amber-400'}`}>
            {recentWinRate}%
          </span>
        </div>
        <div className="flex justify-between">
          <span className="text-white/30">Last 5 Trades P&L</span>
          <span className={`font-mono font-bold ${totalRecentPnL > 0 ? 'text-emerald-400' : 'text-red-400'}`}>
            {totalRecentPnL > 0 ? '+' : ''}{totalRecentPnL.toFixed(2)}
          </span>
        </div>
        <div className="flex justify-between">
          <span className="text-white/30">Consistency</span>
          <span className="text-white/60 font-mono">
            {simulatedAgents ? `${simulatedAgents.history.consistency}%` : (stats.totalTrades > 100 ? '87%' : stats.totalTrades > 50 ? '72%' : '—')}
          </span>
        </div>
        <div className="flex justify-between">
          <span className="text-white/30">Recovery Window</span>
          <span className="text-white/60 font-mono">
            {simulatedAgents ? '1-5 days' : (reports.maxDrawdown > stats.totalPnl * 0.3 ? '3-5 days' : '1-2 days')}
          </span>
        </div>
        <div className="flex justify-between pt-0.5 border-t border-white/[0.05]">
          <span className="text-white/30 font-bold">Analysis Status</span>
          <span className={`font-bold ${stats.totalTrades > 50 ? 'text-emerald-400' : 'text-yellow-400'}`}>
            {stats.totalTrades > 50 ? '✓ Ready' : '⚠ Building'}
          </span>
        </div>
      </div>
    </div>
  );
}
