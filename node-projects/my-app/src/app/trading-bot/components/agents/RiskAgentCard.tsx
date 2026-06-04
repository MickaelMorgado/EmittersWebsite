"use client";

import { Bot, FileText, Settings } from 'lucide-react';
import { BotStats, ReportMetrics, SimulatedAgentOutput } from '../AIReportsSection';
import AgentStatusBadge from './AgentStatusBadge';
import AgentStructuredOutput from './AgentStructuredOutput';

interface RiskAgentCardProps {
  activeAgent: string | null;
  agentLastRun: { risk: string };
  reports: ReportMetrics;
  stats: BotStats;
  simulatedAgents?: SimulatedAgentOutput | null;
  positionSizing: { positionSize: string; riskAmount: number };
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

export default function RiskAgentCard({
  activeAgent,
  agentLastRun,
  reports,
  stats,
  simulatedAgents,
  positionSizing,
  onRulesClick,
  onReportsClick,
}: RiskAgentCardProps) {
  return (
    <div className={`bg-gradient-to-br from-red-500/[0.06] to-rose-500/[0.02] border border-red-500/[0.1] p-2 group hover:border-red-500/[0.2] transition-colors rounded ${
      activeAgent === 'risk' ? 'agent-active-risk' : ''
    }`}>
      <div className="flex items-center justify-between gap-1.5 mb-1">
        <div className="flex items-center gap-1">
          <Bot className="agent-icon w-3.5 h-3.5 text-red-400/60" />
          <span className="agent-title text-[11px] font-bold text-red-300/80 uppercase tracking-wider">Risk</span>
          <span className="text-[10px] text-red-400/50 font-mono">{formatTimeAgo(agentLastRun.risk)}</span>
        </div>
        <div className="flex items-center gap-1">
          <AgentStatusBadge
            status={
              activeAgent === 'risk' ? 'analyzing'
              : simulatedAgents?.risk?.score ? 'approved'
              : simulatedAgents?.risk ? 'rejected'
              : 'offline'
            }
            color="red"
          />
          <button
            onClick={onRulesClick}
            className="p-0.5 hover:bg-red-500/10 rounded transition-opacity"
            title="View rules"
          >
            <Settings className="w-3.5 h-3.5 text-red-400/60" />
          </button>
          <button
            onClick={onReportsClick}
            className="p-0.5 hover:bg-red-500/10 rounded transition-opacity"
            title="View reports"
          >
            <FileText className="w-3.5 h-3.5 text-red-400/60" />
          </button>
        </div>
      </div>
      <div className="h-0.5 bg-white/[0.05] rounded overflow-hidden mb-1">
        <div
          className="progress-bar h-full bg-red-500"
          style={{ width: `${reports.maxDrawdown > stats.totalPnl * 0.5 ? 0 : 100}%` }}
        />
      </div>
      <p className="text-[11px] leading-tight text-white/45 mb-1.5">
        {reports.maxDrawdown > stats.totalPnl * 0.5
          ? '⚠️ High drawdown detected'
          : '✓ Risk within limits'}
      </p>
      <div className="text-[10px] space-y-0.5 border-t border-white/[0.05] pt-1">
        <div className="flex justify-between">
          <span className="text-white/30">SL Distance</span>
          <span className="text-white/60 font-mono">
            {simulatedAgents?.risk?.slDistance ? `${simulatedAgents.risk.slDistance}%` : '2.0%'}
          </span>
        </div>
        <div className="flex justify-between">
          <span className="text-white/30">R:R Target</span>
          <span className="text-white/60 font-mono">
            {simulatedAgents?.risk?.tpRatio
              ? simulatedAgents.risk.tpRatio
              : reports.longestWinStreak > 3
              ? '1:6-9'
              : reports.longestLoseStreak > 3
              ? '1:3-6'
              : '1:1.5'}
          </span>
        </div>
        <div className="flex justify-between">
          <span className="text-white/30">Position Size (Auto)</span>
          <span className="text-emerald-400 font-mono font-bold">
            {simulatedAgents?.risk?.positionSize
              ? simulatedAgents.risk.positionSize
              : positionSizing.positionSize}
          </span>
        </div>
        <div className="flex justify-between">
          <span className="text-white/30">Risk Amount</span>
          <span className="text-red-400 font-mono text-[10px]">
            ${positionSizing.riskAmount.toFixed(2)}
          </span>
        </div>
      </div>
      <AgentStructuredOutput fields={[
        { key: 'agent',         value: 'risk' },
        { key: 'status',        value: activeAgent === 'risk' ? 'analyzing' : simulatedAgents?.risk?.score ? 'approved' : simulatedAgents?.risk ? 'rejected' : 'offline' },
        { key: 'position_size', value: simulatedAgents?.risk?.positionSize ?? null },
        { key: 'sl_pct',        value: simulatedAgents?.risk?.slDistance ?? null },
        { key: 'tp_ratio',      value: simulatedAgents?.risk?.tpRatio ?? null },
        { key: 'risk_amount',   value: positionSizing.riskAmount },
        { key: 'score',         value: simulatedAgents?.risk?.score ?? null },
      ]} />
    </div>
  );
}
