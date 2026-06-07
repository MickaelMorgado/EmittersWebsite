"use client";

import { Bot } from 'lucide-react';
import { useEffect, useState } from 'react';
import { BotStats, ReportMetrics, SimulatedAgentOutput } from '../AIReportsSection';
import AgentStatusBadge from './AgentStatusBadge';

interface AgentWeights {
  risk: number;
  trend: number;
  news: number;
  history: number;
}

interface MasterAgentCardProps {
  activeAgent: string | null;
  agentLastRun: { master: string };
  reports: ReportMetrics;
  stats: BotStats;
  simulatedAgents?: SimulatedAgentOutput | null;
  formatTimeAgo: (timestamp: string) => string;
  debugMode?: boolean;
  onDebugSignal?: (signal: 'BUY' | 'SELL') => void;
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

// Calculate dynamic weights based on agent performance
function calculateDynamicWeights(reports: ReportMetrics, stats: BotStats): AgentWeights {
  // Base weights (all start equal)
  const weights: AgentWeights = {
    risk: 1.0,
    trend: 1.0,
    news: 1.0,
    history: 1.0,
  };

  // Risk Agent: Boost if managing drawdown well
  if (reports.maxDrawdown > 0 && stats.totalPnl > 0) {
    const drawdownRatio = reports.maxDrawdown / stats.totalPnl;
    if (drawdownRatio < 0.2) {
      weights.risk = 1.3; // 30% boost for low drawdown
    } else if (drawdownRatio < 0.5) {
      weights.risk = 1.1; // 10% boost for moderate drawdown
    } else {
      weights.risk = 0.8; // 20% penalty for high drawdown
    }
  }

  // Trend Agent: Boost based on win rate
  const winRate = stats.wins / (stats.wins + stats.losses) || 0;
  if (winRate > 0.65) {
    weights.trend = 1.3; // 30% boost for high win rate
  } else if (winRate > 0.55) {
    weights.trend = 1.15; // 15% boost for good win rate
  } else if (winRate < 0.45) {
    weights.trend = 0.85; // 15% penalty for poor win rate
  }

  // History Agent: Boost based on consistency (number of trades)
  if (stats.totalTrades > 200) {
    weights.history = 1.25; // 25% boost for large sample size
  } else if (stats.totalTrades > 100) {
    weights.history = 1.15; // 15% boost for good sample
  } else if (stats.totalTrades < 30) {
    weights.history = 0.7; // 30% penalty for insufficient data
  }

  // News Agent: Moderate boost (always relevant for market awareness)
  weights.news = 1.0; // Keep stable, as sentiment can be volatile

  // Normalize weights so they sum to 4 (average of 1.0)
  const sum = weights.risk + weights.trend + weights.news + weights.history;
  const normalizedWeights: AgentWeights = {
    risk: (weights.risk / sum) * 1.0,
    trend: (weights.trend / sum) * 1.0,
    news: (weights.news / sum) * 1.0,
    history: (weights.history / sum) * 1.0,
  };

  return normalizedWeights;
}

export default function MasterAgentCard({
  activeAgent,
  agentLastRun,
  reports,
  stats,
  simulatedAgents,
  debugMode = false,
  onDebugSignal,
}: MasterAgentCardProps) {
  // Track which agents have reached APPROVED state (never regress)
  const [_approvedAgents, setApprovedAgents] = useState({
    trend: false,
    history: false,
    risk: false,
    news: false,
  });

  // Update approved agents when they reach APPROVED state
  useEffect(() => {
    const trendApproved = simulatedAgents?.trend?.entry_allowed === true;
    const historyApproved = !!simulatedAgents?.history?.score;
    const riskApproved = !!simulatedAgents?.risk?.score;
    const newsApproved = simulatedAgents?.news?.approved !== false && !!simulatedAgents?.news;

    setApprovedAgents(prev => ({
      trend: prev.trend || trendApproved,
      history: prev.history || historyApproved,
      risk: prev.risk || riskApproved,
      news: prev.news || newsApproved,
    }));
  }, [simulatedAgents]);

  const calculateConfidence = () => {
    const weights = calculateDynamicWeights(reports, stats);

    if (simulatedAgents?.risk && simulatedAgents?.trend && simulatedAgents?.news && simulatedAgents?.history) {
      // Each agent score: 0–25. Weighted sum → 0–100.
      // weight_i / 0.25 normalises so equal weights give factor 1.
      const weightedRisk    = (simulatedAgents.risk.score    || 0) * (weights.risk    / 0.25);
      const weightedTrend   = (simulatedAgents.trend.score   || 0) * (weights.trend   / 0.25);
      const weightedNews    = (simulatedAgents.news.score    || 0) * (weights.news    / 0.25);
      const weightedHistory = (simulatedAgents.history.score || 0) * (weights.history / 0.25);
      // Sum already in 0–100 range (each max 25 * factor ≈ 1); no extra division needed
      return Math.min(100, weightedRisk + weightedTrend + weightedNews + weightedHistory);
    }

    // Fallback: rule-based scores (0–25 each → sum 0–100)
    const riskOk    = reports.maxDrawdown <= stats.totalPnl * 0.5 ? 25 : 0;
    const trendOk   = reports.longestWinStreak > 3 ? 25 : reports.longestLoseStreak > 3 ? 0 : 12;
    const newsOk    = 25;
    const historyOk = stats.totalTrades > 100 ? 25 : stats.totalTrades > 50 ? 15 : 0;

    return Math.min(100,
      (riskOk    * weights.risk    * 4) +
      (trendOk   * weights.trend   * 4) +
      (newsOk    * weights.news    * 4) +
      (historyOk * weights.history * 4)
    );
  };

  const _total = calculateConfidence();
  const weights = calculateDynamicWeights(reports, stats);

  return (
    <div className={`bg-gradient-to-br from-amber-500/[0.06] to-orange-500/[0.02] border border-amber-500/[0.08] p-2 rounded ${
      activeAgent === 'master' ? 'agent-active-master' : ''
    }`}>
      {/* Header */}
      <div className="flex items-center justify-between gap-1 mb-1">
        <div className="flex items-center gap-1">
          <Bot className="agent-icon w-3 h-3 text-amber-400/70" />
          <span className="agent-title text-[11px] font-bold text-amber-300/80 uppercase tracking-wider">Master</span>
          <span className="text-[10px] text-amber-400/50 font-mono">{formatTimeAgo(agentLastRun.master)}</span>
        </div>
      </div>

      {/* Launch Pad — agent status rows */}
      <div className="pt-1 border-t border-white/[0.05] space-y-0.5 mb-1">
        {[
          { label: 'Trend',   detail: simulatedAgents?.trend?.direction ? `${simulatedAgents.trend.direction} · ${simulatedAgents.trend.crossover_status ?? '—'}` : '—', badge: <AgentStatusBadge status={activeAgent === 'trend' ? 'analyzing' : simulatedAgents?.trend?.entry_allowed ? 'approved' : simulatedAgents?.trend ? 'rejected' : 'offline'} color="cyan" /> },
          { label: 'History', detail: simulatedAgents?.history?.score ? `R:R ${simulatedAgents.history.rrTarget ?? '—'} · W ${simulatedAgents.history.consistency ?? '—'}%` : '—', badge: <AgentStatusBadge status={activeAgent === 'history' ? 'analyzing' : simulatedAgents?.history?.score ? 'approved' : simulatedAgents?.history ? 'rejected' : 'offline'} color="emerald" /> },
          { label: 'Risk',    detail: simulatedAgents?.risk?.score ? `${simulatedAgents.risk.positionSize ?? '—'} · SL ${simulatedAgents.risk.slDistance ?? '—'}%` : '—', badge: <AgentStatusBadge status={activeAgent === 'risk' ? 'analyzing' : simulatedAgents?.risk?.score ? 'approved' : simulatedAgents?.risk ? 'rejected' : 'offline'} color="red" /> },
          { label: 'News',    detail: simulatedAgents?.news?.sentiment ? `${simulatedAgents.news.sentiment} · VIX ${simulatedAgents.news.volatility?.toFixed(1) ?? '—'}` : '—', badge: <AgentStatusBadge status={activeAgent === 'news' ? 'analyzing' : !simulatedAgents?.news ? 'offline' : simulatedAgents.news.approved === false ? 'rejected' : 'approved'} color="violet" /> },
        ].map(({ label, detail, badge }) => (
          <div key={label} className="flex items-center justify-between gap-1">
            <span className="text-[10px] text-white/40 w-10 shrink-0">{label}</span>
            <span className="text-[10px] font-mono text-white/40 flex-1 truncate">{detail}</span>
            {badge}
          </div>
        ))}
      </div>

      {/* Strategy + Weights — single compact row each */}
      <div className="pt-1 border-t border-white/[0.05] space-y-0.5 mb-1">
        <div className="flex justify-between items-center">
          <span className="text-[10px] text-white/30">Strategy</span>
          <span className="text-[10px] font-mono text-emerald-400/70">
            {reports.longestWinStreak > 3 ? 'TRENDING+' : reports.longestLoseStreak > 3 ? 'TRENDING−' : 'STATIC'}
          </span>
        </div>
        <div className="flex justify-between items-center">
          <span className="text-[10px] text-white/30">Target R:R</span>
          <span className="text-[10px] font-mono font-bold text-white/60">
            {reports.longestWinStreak > 3 ? `1:${(6 + Math.min(reports.longestWinStreak * 0.5, 3)).toFixed(0)}` : reports.longestLoseStreak > 3 ? `1:${(3 + Math.min(reports.longestLoseStreak * 0.2, 2)).toFixed(1)}` : '1:1.5'}
          </span>
        </div>

        {/* Weight bars in one row */}
        <div className="flex gap-1 pt-0.5">
          {([
            { key: 'risk',    color: 'bg-red-500/60',     val: weights.risk },
            { key: 'trend',   color: 'bg-blue-500/60',    val: weights.trend },
            { key: 'news',    color: 'bg-violet-500/60',  val: weights.news },
            { key: 'history', color: 'bg-emerald-500/60', val: weights.history },
          ] as { key: string; color: string; val: number }[]).map(({ key, color, val }) => (
            <div key={key} className="flex-1">
              <div className="h-0.5 bg-white/[0.05] rounded overflow-hidden">
                <div className={`h-full ${color}`} style={{ width: `${Math.min(val * 100, 100)}%` }} />
              </div>
              <div className="text-[8px] text-white/30 text-center mt-0.5">{(val * 100).toFixed(0)}%</div>
            </div>
          ))}
        </div>
      </div>

      {/* Debug Mode Triggers */}
      {debugMode && (
        <div className="pt-1 border-t border-white/[0.05] grid grid-cols-2 gap-1">
          <button onClick={() => onDebugSignal?.('BUY')} className="py-1 rounded text-[10px] font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 hover:border-emerald-500/60 transition-all">📈 BUY</button>
          <button onClick={() => onDebugSignal?.('SELL')} className="py-1 rounded text-[10px] font-bold bg-red-500/20 text-red-400 border border-red-500/30 hover:border-red-500/60 transition-all">📉 SELL</button>
        </div>
      )}
    </div>
  );
}
