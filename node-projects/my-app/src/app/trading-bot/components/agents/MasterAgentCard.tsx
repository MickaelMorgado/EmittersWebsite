"use client";

import { Bot } from 'lucide-react';
import { useState, useEffect } from 'react';
import { ReportMetrics, BotStats, SimulatedAgentOutput } from '../AIReportsSection';


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
  let weights: AgentWeights = {
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
  const [approvedAgents, setApprovedAgents] = useState({
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
    const newsApproved = simulatedAgents?.news?.sentiment === 'Bullish';

    setApprovedAgents(prev => ({
      trend: prev.trend || trendApproved,
      history: prev.history || historyApproved,
      risk: prev.risk || riskApproved,
      news: prev.news || newsApproved,
    }));
  }, [simulatedAgents]);

  const calculateConfidence = () => {
    if (simulatedAgents && simulatedAgents.risk && simulatedAgents.trend && simulatedAgents.news && simulatedAgents.history) {
      // Use dynamic weights for simulated agents too
      const weights = calculateDynamicWeights(reports, stats);
      const weightedRisk = (simulatedAgents.risk?.score || 0) * (weights.risk / 0.25);
      const weightedTrend = (simulatedAgents.trend?.score || 0) * (weights.trend / 0.25);
      const weightedNews = (simulatedAgents.news?.score || 0) * (weights.news / 0.25);
      const weightedHistory = (simulatedAgents.history?.score || 0) * (weights.history / 0.25);
      return Math.min(100, (weightedRisk + weightedTrend + weightedNews + weightedHistory) / 4);
    }

    // Calculate base scores
    const riskOk = reports.maxDrawdown <= stats.totalPnl * 0.5 ? 25 : 0;
    const trendOk = reports.longestWinStreak > 3 ? 25 : reports.longestLoseStreak > 3 ? 0 : 12;
    const newsOk = 25;
    const historyOk = stats.totalTrades > 100 ? 25 : stats.totalTrades > 50 ? 15 : 0;

    // Apply dynamic weights
    const weights = calculateDynamicWeights(reports, stats);
    const weightedScore =
      (riskOk * weights.risk * 4) +
      (trendOk * weights.trend * 4) +
      (newsOk * weights.news * 4) +
      (historyOk * weights.history * 4);

    return Math.min(100, weightedScore / (25 * 4));
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
  const weights = calculateDynamicWeights(reports, stats);

  return (
    <div className={`bg-gradient-to-br from-amber-500/[0.06] to-orange-500/[0.02] border border-amber-500/[0.08] p-3 rounded ${
      activeAgent === 'master' ? 'agent-active-master' : ''
    }`}>
      <div className="flex items-center justify-between gap-2 mb-2">
        <div className="flex items-center gap-2">
          <Bot className="agent-icon w-3 h-3 text-amber-400/70" />
          <span className="agent-title text-[10px] font-bold text-amber-300/80 uppercase tracking-wider">Master</span>
          <span className="text-[8px] text-amber-400/50 font-mono">{formatTimeAgo(agentLastRun.master)}</span>
        </div>
        <span className={`text-xs font-bold px-2 py-0.5 ${getSignalColor()}`}>
          {getSignal()}
        </span>
      </div>


      {/* LAUNCH PAD - Agent Approval LEDs with Glow */}
      <style>{`
        @keyframes ledGlowCyan {
          0%, 100% { box-shadow: 0 0 4px rgb(34, 211, 238), inset 0 0 4px rgb(34, 211, 238); }
          50% { box-shadow: 0 0 12px rgb(34, 211, 238), inset 0 0 6px rgb(34, 211, 238); }
        }
        .led-approved { animation: ledGlowCyan 1.5s ease-in-out infinite; }
      `}</style>

      <div className="mb-2 pt-2 border-t border-white/[0.05]">
        <div className="flex items-center justify-between mb-2.5">
          <span className="text-[9px] text-white/30 uppercase font-bold tracking-wider">Launch Pad</span>
          <span className={`text-[8px] font-bold px-2 py-0.5 rounded ${
            approvedAgents.trend && approvedAgents.history && approvedAgents.risk && approvedAgents.news
              ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
              : 'bg-yellow-500/10 text-yellow-400/60 border border-yellow-500/20'
          }`}>
            {approvedAgents.trend && approvedAgents.history && approvedAgents.risk && approvedAgents.news ? '🚀 GO' : '⏳ Waiting'}
          </span>
        </div>

        <div className="flex gap-3">
          {/* Trend Agent LED + Label */}
          <div className="flex items-center gap-1">
            <div className={`w-3 h-3 rounded transition-all border border-white/20 ${
              approvedAgents.trend
                ? 'bg-cyan-500 led-approved shadow-cyan-500/70'
                : 'bg-slate-500/40 shadow-slate-500/20'
            }`} />
            <span className="text-[6.5px] text-white/50">Trend</span>
          </div>

          {/* History Agent LED + Label */}
          <div className="flex items-center gap-1">
            <div className={`w-3 h-3 rounded transition-all border border-white/20 ${
              approvedAgents.history
                ? 'bg-cyan-500 led-approved shadow-cyan-500/70'
                : 'bg-slate-500/40 shadow-slate-500/20'
            }`} />
            <span className="text-[6.5px] text-white/50">History</span>
          </div>

          {/* Risk Agent LED + Label */}
          <div className="flex items-center gap-1">
            <div className={`w-3 h-3 rounded transition-all border border-white/20 ${
              approvedAgents.risk
                ? 'bg-cyan-500 led-approved shadow-cyan-500/70'
                : 'bg-slate-500/40 shadow-slate-500/20'
            }`} />
            <span className="text-[6.5px] text-white/50">Risk</span>
          </div>

          {/* News Agent LED + Label */}
          <div className="flex items-center gap-1">
            <div className={`w-3 h-3 rounded transition-all border border-white/20 ${
              approvedAgents.news
                ? 'bg-cyan-500 led-approved shadow-cyan-500/70'
                : 'bg-slate-500/40 shadow-slate-500/20'
            }`} />
            <span className="text-[6.5px] text-white/50">News</span>
          </div>
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

      {/* Dynamic Weight Adjustments */}
      <div className="mb-2 pt-2 border-t border-white/[0.05]">
        <div className="text-[7px] space-y-0.5">
          <div className="flex justify-between items-center">
            <span className="text-white/30">Agent Weights</span>
            <span className="text-white/40 text-[6px]">Dynamic Allocation</span>
          </div>
          <div className="flex gap-1">
            <div className="flex-1">
              <div className="text-[6px] text-white/40 mb-0.5">Risk</div>
              <div className="h-1 bg-white/[0.05] rounded overflow-hidden">
                <div
                  className="h-full bg-red-500/60"
                  style={{ width: `${Math.min(weights.risk * 100, 100)}%` }}
                />
              </div>
              <div className="text-[6px] text-red-400/70 mt-0.5">{(weights.risk * 100).toFixed(0)}%</div>
            </div>
            <div className="flex-1">
              <div className="text-[6px] text-white/40 mb-0.5">Trend</div>
              <div className="h-1 bg-white/[0.05] rounded overflow-hidden">
                <div
                  className="h-full bg-blue-500/60"
                  style={{ width: `${Math.min(weights.trend * 100, 100)}%` }}
                />
              </div>
              <div className="text-[6px] text-blue-400/70 mt-0.5">{(weights.trend * 100).toFixed(0)}%</div>
            </div>
            <div className="flex-1">
              <div className="text-[6px] text-white/40 mb-0.5">News</div>
              <div className="h-1 bg-white/[0.05] rounded overflow-hidden">
                <div
                  className="h-full bg-violet-500/60"
                  style={{ width: `${Math.min(weights.news * 100, 100)}%` }}
                />
              </div>
              <div className="text-[6px] text-violet-400/70 mt-0.5">{(weights.news * 100).toFixed(0)}%</div>
            </div>
            <div className="flex-1">
              <div className="text-[6px] text-white/40 mb-0.5">Hist</div>
              <div className="h-1 bg-white/[0.05] rounded overflow-hidden">
                <div
                  className="h-full bg-emerald-500/60"
                  style={{ width: `${Math.min(weights.history * 100, 100)}%` }}
                />
              </div>
              <div className="text-[6px] text-emerald-400/70 mt-0.5">{(weights.history * 100).toFixed(0)}%</div>
            </div>
          </div>
        </div>
      </div>

      <p className="text-[8px] leading-relaxed text-white/50">
        {total >= 75
          ? '✓ GATE OPEN: All agents aligned for execution'
          : total >= 50
          ? '⚠ GATE PARTIAL: Trade with adjusted risk/reward'
          : '✗ GATE CLOSED: Insufficient confidence'}
      </p>

      {/* Debug Mode Triggers */}
      {debugMode && (
        <div className="mt-2 pt-2 border-t border-white/[0.05] space-y-2">
          <p className="text-[7px] text-amber-400/70 font-bold uppercase">Debug Mode</p>
          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={() => onDebugSignal?.('BUY')}
              className="py-1.5 px-2 rounded text-[8px] font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 hover:border-emerald-500/100 transition-all cursor-pointer"
            >
              📈 BUY
            </button>
            <button
              onClick={() => onDebugSignal?.('SELL')}
              className="py-1.5 px-2 rounded text-[8px] font-bold bg-red-500/20 text-red-400 border border-red-500/30 hover:border-red-500/100 transition-all cursor-pointer"
            >
              📉 SELL
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
