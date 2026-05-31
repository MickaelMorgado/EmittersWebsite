"use client";

import { X, FileText, Filter } from 'lucide-react';
import { useState, useEffect } from 'react';

interface AgentReport {
  id: string;
  agent: 'trend' | 'risk' | 'news' | 'history' | 'master';
  timestamp: string;
  message: string;
  data: any;
  action?: string;
}

interface AgentReportsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const AGENT_COLORS = {
  trend: { bg: 'bg-cyan-500/10', border: 'border-cyan-500/30', text: 'text-cyan-400' },
  risk: { bg: 'bg-red-500/10', border: 'border-red-500/30', text: 'text-red-400' },
  news: { bg: 'bg-violet-500/10', border: 'border-violet-500/30', text: 'text-violet-400' },
  history: { bg: 'bg-emerald-500/10', border: 'border-emerald-500/30', text: 'text-emerald-400' },
  master: { bg: 'bg-amber-500/10', border: 'border-amber-500/30', text: 'text-amber-400' },
};

function formatTime(timestamp: string): string {
  const date = new Date(timestamp);
  const now = new Date();
  const seconds = Math.floor((now.getTime() - date.getTime()) / 1000);

  if (seconds < 60) return `${seconds}s ago`;
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
  return date.toLocaleDateString();
}

export default function AgentReportsModal({ isOpen, onClose }: AgentReportsModalProps) {
  const [reports, setReports] = useState<AgentReport[]>([]);
  const [filter, setFilter] = useState<'all' | AgentReport['agent']>('all');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isOpen) {
      fetchReports();
      const interval = setInterval(fetchReports, 5000); // Refresh every 5s
      return () => clearInterval(interval);
    }
  }, [isOpen]);

  const fetchReports = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/trading-bot/agent-reports');
      const data = await res.json();
      setReports(data.reports || []);
    } catch (error) {
      console.error('Failed to fetch reports:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredReports = filter === 'all' ? reports : reports.filter(r => r.agent === filter);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-[#0f172a] border border-white/[0.05] rounded-lg w-full max-w-2xl max-h-[80vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-white/[0.05] shrink-0">
          <div className="flex items-center gap-2">
            <FileText className="w-4 h-4 text-violet-400" />
            <h2 className="text-sm font-bold text-white uppercase tracking-wide">Agent Reports</h2>
            <span className="text-xs text-white/40 font-mono">({filteredReports.length})</span>
          </div>
          <button
            onClick={onClose}
            className="p-1 hover:bg-white/10 rounded transition-colors"
          >
            <X className="w-4 h-4 text-white/60" />
          </button>
        </div>

        {/* Filter */}
        <div className="flex gap-1 p-3 border-b border-white/[0.05] shrink-0 overflow-x-auto">
          <button
            onClick={() => setFilter('all')}
            className={`px-3 py-1 text-xs rounded transition-colors whitespace-nowrap ${
              filter === 'all'
                ? 'bg-white/20 text-white'
                : 'bg-white/5 text-white/60 hover:bg-white/10'
            }`}
          >
            All
          </button>
          {(Object.keys(AGENT_COLORS) as AgentReport['agent'][]).map(agent => (
            <button
              key={agent}
              onClick={() => setFilter(agent)}
              className={`px-3 py-1 text-xs rounded transition-colors whitespace-nowrap capitalize ${
                filter === agent
                  ? `${AGENT_COLORS[agent].bg} ${AGENT_COLORS[agent].text}`
                  : 'bg-white/5 text-white/60 hover:bg-white/10'
              }`}
            >
              {agent}
            </button>
          ))}
        </div>

        {/* Reports List */}
        <div className="flex-1 overflow-y-auto">
          {loading ? (
            <div className="flex items-center justify-center h-32 text-white/40 text-sm">
              Loading reports...
            </div>
          ) : filteredReports.length === 0 ? (
            <div className="flex items-center justify-center h-32 text-white/40 text-sm">
              No reports available
            </div>
          ) : (
            <div className="divide-y divide-white/[0.05]">
              {filteredReports.map(report => (
                <div
                  key={report.id}
                  className={`p-3 border-l-2 ${
                    AGENT_COLORS[report.agent].border
                  } hover:bg-white/[0.02] transition-colors`}
                >
                  <div className="flex items-start justify-between gap-2 mb-1">
                    <div className="flex items-center gap-2 flex-1">
                      <span
                        className={`text-[10px] font-bold uppercase ${AGENT_COLORS[report.agent].text}`}
                      >
                        {report.agent}
                      </span>
                      {report.action && (
                        <span className="text-[9px] bg-white/10 text-white/70 px-1.5 py-0.5 rounded">
                          {report.action}
                        </span>
                      )}
                    </div>
                    <span className="text-[9px] text-white/30 font-mono whitespace-nowrap">
                      {formatTime(report.timestamp)}
                    </span>
                  </div>
                  <p className="text-[11px] text-white/80 leading-snug mb-1.5">
                    {report.message}
                  </p>
                  {report.data && Object.keys(report.data).length > 0 && (
                    <div className="text-[9px] bg-white/[0.02] p-2 rounded border border-white/[0.05] font-mono text-white/50 max-h-12 overflow-hidden">
                      {JSON.stringify(report.data, null, 2)}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="border-t border-white/[0.05] p-3 flex justify-between items-center shrink-0 text-xs text-white/40">
          <span>Last updated: {new Date().toLocaleTimeString()}</span>
          <button
            onClick={async () => {
              await fetch('/api/trading-bot/agent-reports', { method: 'DELETE' });
              fetchReports();
            }}
            className="text-red-400/60 hover:text-red-400 transition-colors"
          >
            Clear all
          </button>
        </div>
      </div>
    </div>
  );
}
