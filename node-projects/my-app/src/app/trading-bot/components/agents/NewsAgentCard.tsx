"use client";

import { Bot, ExternalLink, FileText, Settings } from 'lucide-react';
import { ReportMetrics, SimulatedAgentOutput } from '../AIReportsSection';
import AgentStatusBadge from './AgentStatusBadge';

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
        <div className="mb-1.5 pb-1.5 border-b border-white/[0.05] space-y-0.5">
          {displayNews.map((news: any, idx: number) => (
            <a
              key={idx}
              href={news.link}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1 bg-white/[0.02] px-1 py-0.5 rounded border border-violet-500/[0.08] hover:border-violet-500/[0.25] hover:bg-white/[0.04] transition-all group cursor-pointer"
            >
              <span className={`shrink-0 text-[8px] px-0.5 rounded ${
                news.analysis?.sentiment === 'Bullish' ? 'bg-emerald-500/20 text-emerald-400' :
                news.analysis?.sentiment === 'Bearish' ? 'bg-red-500/20 text-red-400' :
                'bg-amber-500/20 text-amber-400'
              }`}>
                {(news.analysis?.sentiment || 'N')[0]}
              </span>
              <p className="text-[10px] text-white/60 line-clamp-1 flex-1 leading-snug">{news.title}</p>
              <ExternalLink className="w-2.5 h-2.5 text-violet-400/30 group-hover:text-violet-400 flex-shrink-0 transition-colors" />
            </a>
          ))}
        </div>
      ) : (
        <p className="text-[10px] leading-tight text-white/40 mb-1">No major news</p>
      )}

      {/* Plain-Language Recap — explains today's headlines in everyday words,
          so non-trader users build economic understanding over time instead
          of just seeing raw sentiment/volatility metrics. */}
      {simulatedAgents?.news?.plain_summary && (
        <div className="mb-1.5 pb-1.5 border-b border-white/[0.05]">
          <div className="flex items-center gap-1 mb-0.5">
            <span className="text-[8px] font-bold text-violet-300/50 uppercase tracking-widest">In Plain Words</span>
          </div>
          <p className="text-[10px] text-white/50 leading-relaxed italic max-h-12 overflow-y-auto pr-1">
            {simulatedAgents.news.plain_summary}
          </p>
        </div>
      )}

      {/* Metrics Section */}
      <div className="text-[10px] space-y-0.5">
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
    </div>
  );
}
