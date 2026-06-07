"use client";

import { useEffect, useState } from 'react';
import { Bot, FileText, Settings } from 'lucide-react';
import { ReportMetrics, SimulatedAgentOutput } from '../AIReportsSection';
import AgentStatusBadge from './AgentStatusBadge';
import MiniOHLCChart from './MiniOHLCChart';

interface TrendAgentCardProps {
  activeAgent: string | null;
  agentLastRun: { trend: string };
  reports: ReportMetrics;
  simulatedAgents?: SimulatedAgentOutput | null;
  onRulesClick: () => void;
  onReportsClick: () => void;
  /** Opens the agent's detail popup directly on its "State" tab — wired to the status badge. */
  onStateClick?: () => void;
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

function formatSeconds(totalSeconds: number): string {
  const seconds = Math.max(0, Math.floor(totalSeconds));
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
  onStateClick,
}: TrendAgentCardProps) {
  // Tick every second so the "Xs/Xm ago" badge counts up live and is correct
  // immediately on mount/refresh — it's derived straight from the candle's
  // own open time (ma_data.json's timestamp), not from a locally-tracked
  // "last fetched" moment that could lag behind reality.
  const [, forceTick] = useState(0);
  useEffect(() => {
    const id = setInterval(() => forceTick(t => t + 1), 1000);
    return () => clearInterval(id);
  }, []);

  // Timezone-safe live age: the API hands us "seconds since candle opened"
  // (computed purely from the broker's own clocks, so broker/local timezone
  // offsets cancel out) plus the local Date.now() when we received it. We
  // simply add the elapsed wall-clock time since then — this is correct the
  // instant the page loads/refreshes, no waiting for the next poll.
  const baseAge = simulatedAgents?.trend?.candle_age_seconds;
  const measuredAt = simulatedAgents?.trend?.candle_age_measured_at;
  const lastRunLabel =
    typeof baseAge === 'number' && typeof measuredAt === 'number'
      ? formatSeconds(baseAge + (Date.now() - measuredAt) / 1000)
      : formatTimeAgo(agentLastRun.trend);

  return (
    <div className={`bg-gradient-to-br from-cyan-500/[0.06] to-blue-500/[0.02] border border-cyan-500/[0.1] p-2 group hover:border-cyan-500/[0.2] transition-colors rounded ${
      activeAgent === 'trend' ? 'agent-active-trend' : ''
    }`}>
      <div className="flex items-center justify-between gap-1.5 mb-1">
        <div className="flex items-center gap-1">
          <Bot className="agent-icon w-3.5 h-3.5 text-cyan-400/60" />
          <span className="agent-title text-[11px] font-bold text-cyan-300/80 uppercase tracking-wider">Trend</span>
          <span className="text-[10px] text-cyan-400/50 font-mono">{lastRunLabel}</span>
        </div>
        <div className="flex items-center gap-1">
          <AgentStatusBadge
            status={activeAgent === 'trend' ? 'analyzing' : simulatedAgents?.trend?.entry_allowed ? 'approved' : simulatedAgents?.trend ? 'rejected' : 'offline'}
            color="cyan"
            onClick={onStateClick}
          />
          <button
            onClick={onRulesClick}
            className="p-0.5 hover:bg-cyan-500/10 transition-opacity"
            title="View rules"
          >
            <Settings className="w-3.5 h-3.5 text-cyan-400/60" />
          </button>
          <button
            onClick={onReportsClick}
            className="p-0.5 hover:bg-cyan-500/10 transition-opacity"
            title="View reports"
          >
            <FileText className="w-3.5 h-3.5 text-cyan-400/60" />
          </button>
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
      <div className="text-[10px] space-y-0.5 border-t border-white/[0.05] pt-1">
        <div className="flex justify-between">
          <span className="text-white/30">MA9 / MA21 / MA50</span>
          <span className="text-white/60 font-mono">
            {simulatedAgents?.trend?.ma_9
              ? `${simulatedAgents.trend.ma_9.toFixed(2)} / ${simulatedAgents.trend.ma_21?.toFixed(2) || 'N/A'} / ${simulatedAgents.trend.ma_50?.toFixed(2) || 'N/A'}`
              : 'Updating...'}
          </span>
        </div>
        <div className="flex justify-between">
          <span className="text-white/30">Crossover Status</span>
          <span className={`text-white/60 font-mono ${
            simulatedAgents?.trend?.crossover_status === 'UP' ? 'text-emerald-400' :
            simulatedAgents?.trend?.crossover_status === 'DOWN' ? 'text-red-400' :
            'text-white/40'
          }`}>
            {simulatedAgents?.trend?.crossover_status === 'UP' ? '↑ UP' :
             simulatedAgents?.trend?.crossover_status === 'DOWN' ? '↓ DOWN' :
             '— NONE'}
          </span>
        </div>
        <div className="flex justify-between">
          <span className="text-white/30">MA50 Trend</span>
          <span className={`text-white/60 font-mono ${
            simulatedAgents?.trend?.ma_50_trend === 'Uptrend' ? 'text-emerald-400' :
            simulatedAgents?.trend?.ma_50_trend === 'Downtrend' ? 'text-red-400' :
            'text-white/40'
          }`}>
            {simulatedAgents?.trend?.ma_50_trend || 'Neutral'}
          </span>
        </div>
        <div className="flex justify-between pt-0.5 border-t border-white/[0.05]">
          <span className="text-white/30 font-bold">Entry Allowed</span>
          <span className={`font-bold ${simulatedAgents?.trend?.entry_allowed ? 'text-emerald-400' : 'text-red-400'}`}>
            {simulatedAgents?.trend?.entry_allowed ? '✓ Yes' : '✗ No'}
          </span>
        </div>
      </div>

      {/* ── Live OHLC Chart ── */}
      <div className="border-t border-white/[0.05] pt-1 mt-1">
        <span className="text-[9px] font-bold text-white/20 uppercase tracking-widest">BTCUSDT · 1m</span>
        <MiniOHLCChart
          crossoverStatus={simulatedAgents?.trend?.crossover_status}
        />
      </div>
    </div>
  );
}
