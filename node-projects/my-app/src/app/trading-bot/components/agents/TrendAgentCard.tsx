"use client";

import { Bot, Settings, FileText } from 'lucide-react';
import { ReportMetrics } from '../AIReportsSection';
import { SimulatedAgentOutput } from '../AIReportsSection';

interface TrendAgentCardProps {
  activeAgent: string | null;
  agentLastRun: { trend: string };
  reports: ReportMetrics;
  simulatedAgents?: SimulatedAgentOutput | null;
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

export default function TrendAgentCard({
  activeAgent,
  agentLastRun,
  reports,
  simulatedAgents,
  onRulesClick,
  onReportsClick,
}: TrendAgentCardProps) {
  return (
    <div className={`bg-gradient-to-br from-cyan-500/[0.06] to-blue-500/[0.02] border border-cyan-500/[0.1] p-2 group hover:border-cyan-500/[0.2] transition-colors rounded ${
      activeAgent === 'trend' ? 'agent-active-trend' : ''
    }`}>
      <div className="flex items-center justify-between gap-1.5 mb-1">
        <div className="flex items-center gap-1">
          <Bot className="agent-icon w-2.5 h-2.5 text-cyan-400/60" />
          <span className="agent-title text-[8px] font-bold text-cyan-300/80 uppercase tracking-wider">Trend</span>
          <span className="text-[7px] text-cyan-400/50 font-mono">{formatTimeAgo(agentLastRun.trend)}</span>
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={onRulesClick}
            className="p-0.5 hover:bg-cyan-500/10 opacity-0 group-hover:opacity-100 transition-opacity"
            title="View rules"
          >
            <Settings className="w-2.5 h-2.5 text-cyan-400/60" />
          </button>
          <button
            onClick={onReportsClick}
            className="p-0.5 hover:bg-cyan-500/10 opacity-0 group-hover:opacity-100 transition-opacity"
            title="View reports"
          >
            <FileText className="w-2.5 h-2.5 text-cyan-400/60" />
          </button>
          <span className="text-[8px] font-bold text-cyan-400 font-mono">
            {simulatedAgents ? `${simulatedAgents.trend.score}pts` : reports.longestWinStreak > 3 ? '25' : reports.longestLoseStreak > 3 ? '0' : '12'}%
          </span>
        </div>
      </div>
      <div className="h-0.5 bg-white/[0.05] overflow-hidden mb-1">
        <div
          className="progress-bar h-full bg-cyan-500"
          style={{
            width: `${
              simulatedAgents
                ? (simulatedAgents.trend.score / 25) * 100
                : reports.longestWinStreak > 3 ? 100 : reports.longestLoseStreak > 3 ? 0 : 48
            }%`
          }}
        />
      </div>
      <p className="text-[8px] leading-tight text-white/45 mb-1.5">
        {simulatedAgents
          ? `${simulatedAgents.trend.direction === 'BUY' ? '📈' : simulatedAgents.trend.direction === 'SELL' ? '📉' : '◼'} ${simulatedAgents.trend.direction}`
          : reports.longestWinStreak > 3
          ? '📈 Strong uptrend'
          : reports.longestLoseStreak > 3
          ? '📉 Downtrend caution'
          : '◼ Neutral trend'}
      </p>
      <div className="text-[7px] space-y-0.5 border-t border-white/[0.05] pt-1">
        <div className="flex justify-between">
          <span className="text-white/30">MA5 & MA20</span>
          <span className={`text-white/60 font-mono ${reports.longestWinStreak > 2 ? 'text-cyan-400' : 'text-white/40'}`}>
            {reports.longestWinStreak > 2 ? '✓ Crossing' : '✗ Not aligned'}
          </span>
        </div>
        <div className="flex justify-between">
          <span className="text-white/30">MA200 Angle</span>
          <span className="text-white/60 font-mono">
            {reports.longestWinStreak > 3 ? '0.0045' : reports.longestLoseStreak > 3 ? '-0.0035' : '0.0008'}
          </span>
        </div>
        <div className="flex justify-between">
          <span className="text-white/30">MA200 Trend</span>
          <span className={`text-white/60 font-mono ${reports.longestWinStreak > 3 ? 'text-emerald-400' : reports.longestLoseStreak > 3 ? 'text-red-400' : 'text-white/40'}`}>
            {reports.longestWinStreak > 3 ? 'Bullish' : reports.longestLoseStreak > 3 ? 'Bearish' : 'Flat'}
          </span>
        </div>
        <div className="flex justify-between pt-0.5 border-t border-white/[0.05]">
          <span className="text-white/30 font-bold">Status</span>
          <span className={`font-bold ${reports.longestWinStreak > 2 && reports.longestWinStreak > 3 ? 'text-emerald-400' : 'text-yellow-400'}`}>
            {reports.longestWinStreak > 2 && reports.longestWinStreak > 3 ? '✓ Good' : '⚠ Check'}
          </span>
        </div>
      </div>
    </div>
  );
}
