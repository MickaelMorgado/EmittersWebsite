"use client";

import { Bot, ExternalLink, FileText, Settings } from 'lucide-react';
import { ReportMetrics, SimulatedAgentOutput } from '../AIReportsSection';
import AgentStatusBadge from './AgentStatusBadge';
import AgentStructuredOutput from './AgentStructuredOutput';

interface NewsAgentCardProps {
  activeAgent: string | null;
  agentLastRun: { news: string };
  reports: ReportMetrics;
  simulatedAgents?: SimulatedAgentOutput | null;
  displayNews: any[];
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

export default function NewsAgentCard({
  activeAgent,
  agentLastRun,
  reports,
  simulatedAgents,
  displayNews,
  onRulesClick,
  onReportsClick,
}: NewsAgentCardProps) {
  return (
    <div className={`bg-gradient-to-br from-violet-500/[0.06] to-purple-500/[0.02] border border-violet-500/[0.1] p-2 group hover:border-violet-500/[0.2] transition-colors rounded flex flex-col ${
      activeAgent === 'news' ? 'agent-active-news' : ''
    }`}>
      <div className="flex items-center justify-between gap-1.5 mb-1">
        <div className="flex items-center gap-1">
          <Bot className="agent-icon w-3.5 h-3.5 text-violet-400/60" />
          <span className="agent-title text-[11px] font-bold text-violet-300/80 uppercase tracking-wider">News</span>
          <span className="text-[11px] text-violet-400/50 font-mono">{formatTimeAgo(agentLastRun.news)}</span>
        </div>
        <div className="flex items-center gap-1">
          <AgentStatusBadge
            status={
              activeAgent === 'news' ? 'analyzing'
              : !simulatedAgents?.news ? 'offline'
              : simulatedAgents.news.approved === false ? 'rejected'
              : 'approved'
            }
            color="violet"
          />
          <button
            onClick={onRulesClick}
            className="p-0.5 hover:bg-violet-500/10 transition-opacity"
            title="View rules"
          >
            <Settings className="w-3.5 h-3.5 text-violet-400/60" />
          </button>
          <button
            onClick={onReportsClick}
            className="p-0.5 hover:bg-violet-500/10 transition-opacity"
            title="View reports"
          >
            <FileText className="w-3.5 h-3.5 text-violet-400/60" />
          </button>
        </div>
      </div>
      <div className="h-0.5 bg-white/[0.05] overflow-hidden mb-1">
        <div className="progress-bar h-full bg-violet-500" style={{ width: '100%' }} />
      </div>

      {/* News Headlines Section */}
      {displayNews && displayNews.length > 0 ? (
        <div className="mb-2 pb-2 border-b border-white/[0.05] space-y-1">
          {displayNews.map((news: any, idx: number) => (
            <a
              key={idx}
              href={news.link}
              target="_blank"
              rel="noopener noreferrer"
              className="block bg-white/[0.02] p-1 rounded border border-violet-500/[0.08] hover:border-violet-500/[0.25] hover:bg-white/[0.04] transition-all group cursor-pointer"
            >
              <div className="flex items-start gap-1 mb-0.5">
                <p className="text-xs text-white/70 font-medium line-clamp-2 flex-1">
                  {news.title}
                </p>
                <ExternalLink className="w-3.5 h-3.5 text-violet-400/40 group-hover:text-violet-400 flex-shrink-0 mt-0.5 transition-colors" />
              </div>
              <div className="flex items-center gap-1 text-[6.5px]">
                <span className="text-white/40">{news.source}</span>
                <span className={`px-1 py-0 rounded ${
                  news.analysis?.sentiment === 'Bullish' ? 'bg-emerald-500/20 text-emerald-400' :
                  news.analysis?.sentiment === 'Bearish' ? 'bg-red-500/20 text-red-400' :
                  'bg-amber-500/20 text-amber-400'
                }`}>
                  {news.analysis?.sentiment || 'Neutral'}
                </span>
              </div>
            </a>
          ))}
        </div>
      ) : (
        <p className="text-sm leading-tight text-white/45 mb-2">
          No major news events
        </p>
      )}

      {/* Metrics Section */}
      <div className="text-xs space-y-0.5">
        <div className="flex justify-between">
          <span className="text-white/30">Market Sentiment</span>
          <span className={`text-white/60 font-mono ${simulatedAgents ? (simulatedAgents.news.sentiment === 'Bullish' ? 'text-emerald-400' : simulatedAgents.news.sentiment === 'Bearish' ? 'text-red-400' : 'text-amber-400') : (reports.longestWinStreak > 3 ? 'text-emerald-400' : 'text-amber-400')}`}>
            {simulatedAgents ? simulatedAgents.news.sentiment : (reports.longestWinStreak > 3 ? 'Bullish' : 'Neutral')}
          </span>
        </div>
        <div className="flex justify-between">
          <span className="text-white/30">Volatility (VIX)</span>
          <span className="text-white/60 font-mono">
            {simulatedAgents ? simulatedAgents.news.volatility.toFixed(1) : (reports.longestWinStreak > 3 ? '14.2' : '19.8')}
          </span>
        </div>
        <div className="flex justify-between">
          <span className="text-white/30">Event Impact</span>
          <span className="text-white/60 font-mono">{simulatedAgents ? 'Variable' : 'Low'}</span>
        </div>
        <div className="flex justify-between pt-0.5 border-t border-white/[0.05]">
          <span className="text-white/30 font-bold">Risk Level</span>
          <span className={`font-bold ${simulatedAgents ? (simulatedAgents.news.volatility > 20 ? 'text-red-400' : simulatedAgents.news.volatility > 15 ? 'text-yellow-400' : 'text-emerald-400') : 'text-yellow-400'}`}>
            {simulatedAgents ? (simulatedAgents.news.volatility > 20 ? '🔴 High' : simulatedAgents.news.volatility > 15 ? '⚠ Medium' : '✓ Low') : '⚠ Medium'}
          </span>
        </div>
      </div>
      <AgentStructuredOutput fields={[
        { key: 'agent',            value: 'news' },
        { key: 'status',           value: activeAgent === 'news' ? 'analyzing' : !simulatedAgents?.news ? 'offline' : simulatedAgents.news.approved === false ? 'rejected' : 'approved' },
        { key: 'approved',         value: simulatedAgents?.news?.approved ?? null },
        { key: 'sentiment',        value: simulatedAgents?.news?.sentiment ?? null },
        { key: 'volatility',       value: simulatedAgents?.news?.volatility ?? null },
        { key: 'high_impact',      value: simulatedAgents?.news?.high_impact_count ?? null },
        { key: 'score',            value: simulatedAgents?.news?.score ?? null },
      ]} />
    </div>
  );
}
