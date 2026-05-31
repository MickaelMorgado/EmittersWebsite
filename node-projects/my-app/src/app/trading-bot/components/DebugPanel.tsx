"use client";

import { ChevronDown, ChevronUp, Play, Pause, RotateCcw, Zap } from 'lucide-react';
import { useState } from 'react';

interface DebugPanelProps {
  debugMode: boolean;
  onDebugToggle: (enabled: boolean) => void;
  onManualSignal: (agent: string) => void;
  agentLastRun: { [key: string]: string };
  activeAgent: string | null;
  stats: any;
}

interface SignalLog {
  id: string;
  agent: string;
  timestamp: string;
  signal?: string;
}

export default function DebugPanel({
  debugMode,
  onDebugToggle,
  onManualSignal,
  agentLastRun,
  activeAgent,
  stats,
}: DebugPanelProps) {
  const [expanded, setExpanded] = useState(false);
  const [signalLogs, setSignalLogs] = useState<SignalLog[]>([]);

  const agents = [
    { name: 'trend', label: 'Trend', color: 'bg-blue-500/20', textColor: 'text-blue-400' },
    { name: 'risk', label: 'Risk', color: 'bg-red-500/20', textColor: 'text-red-400' },
    { name: 'news', label: 'News', color: 'bg-violet-500/20', textColor: 'text-violet-400' },
    { name: 'history', label: 'History', color: 'bg-emerald-500/20', textColor: 'text-emerald-400' },
  ];

  const handleManualSignal = (agent: string) => {
    onManualSignal(agent);
    // Add to signal log
    const newLog: SignalLog = {
      id: Math.random().toString(36),
      agent,
      timestamp: new Date().toLocaleTimeString(),
    };
    setSignalLogs(prev => [newLog, ...prev].slice(0, 10));
  };

  const formatTimeAgo = (timestamp: string): string => {
    const now = new Date();
    const then = new Date(timestamp);
    const seconds = Math.floor((now.getTime() - then.getTime()) / 1000);

    if (seconds < 60) return `${seconds}s`;
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m`;
    if (seconds < 86400) return `${Math.floor(seconds / 3600)}h`;
    return `${Math.floor(seconds / 86400)}d`;
  };

  return (
    <div className="fixed bottom-4 right-4 w-80 bg-gradient-to-br from-slate-900/95 to-slate-950/95 border border-slate-700/50 rounded-lg shadow-2xl z-50">
      {/* Header */}
      <div
        className="flex items-center justify-between p-3 cursor-pointer hover:bg-slate-800/50 transition-colors"
        onClick={() => setExpanded(!expanded)}
      >
        <div className="flex items-center gap-2">
          <Zap className="w-4 h-4 text-yellow-400" />
          <span className="text-xs font-bold text-white/80 uppercase">Debug Panel</span>
          <span className={`w-2 h-2 rounded-full ${debugMode ? 'bg-emerald-400 animate-pulse' : 'bg-slate-600'}`} />
        </div>
        {expanded ? (
          <ChevronUp className="w-4 h-4 text-white/50" />
        ) : (
          <ChevronDown className="w-4 h-4 text-white/50" />
        )}
      </div>

      {/* Expanded Content */}
      {expanded && (
        <div className="p-3 space-y-3 border-t border-slate-700/50 max-h-96 overflow-y-auto">
          {/* Mode Toggle */}
          <div className="space-y-2">
            <div className="text-[10px] text-white/40 uppercase font-bold">Mode</div>
            <button
              onClick={() => onDebugToggle(!debugMode)}
              className={`w-full py-2 px-3 rounded text-[11px] font-bold transition-all flex items-center justify-center gap-2 ${
                debugMode
                  ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                  : 'bg-slate-700/30 text-white/50 border border-slate-600/30'
              }`}
            >
              {debugMode ? (
                <>
                  <Pause className="w-3 h-3" />
                  Debug Mode ON
                </>
              ) : (
                <>
                  <Play className="w-3 h-3" />
                  Debug Mode OFF
                </>
              )}
            </button>
          </div>

          {/* Manual Signal Triggers */}
          <div className="space-y-2">
            <div className="text-[10px] text-white/40 uppercase font-bold">Manual Triggers</div>
            <div className="grid grid-cols-2 gap-2">
              {agents.map(agent => (
                <button
                  key={agent.name}
                  onClick={() => handleManualSignal(agent.name)}
                  disabled={!debugMode}
                  className={`py-1.5 px-2 rounded text-[9px] font-bold transition-all border ${
                    debugMode
                      ? `${agent.color} ${agent.textColor} border-opacity-30 hover:border-opacity-100 cursor-pointer`
                      : 'bg-slate-700/20 text-white/30 border-slate-600/20 cursor-not-allowed'
                  }`}
                >
                  {agent.label}
                </button>
              ))}
            </div>
          </div>

          {/* Agent Status */}
          <div className="space-y-2">
            <div className="text-[10px] text-white/40 uppercase font-bold">Agent Status</div>
            <div className="space-y-1 bg-slate-950/50 rounded p-2">
              {agents.map(agent => (
                <div
                  key={agent.name}
                  className="flex items-center justify-between text-[9px] px-2 py-1 rounded bg-slate-800/30"
                >
                  <span className={agent.textColor}>{agent.label}</span>
                  <span className="text-white/50 font-mono">
                    {agentLastRun[agent.name]
                      ? formatTimeAgo(agentLastRun[agent.name])
                      : '—'}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Signal History */}
          {signalLogs.length > 0 && (
            <div className="space-y-2">
              <div className="text-[10px] text-white/40 uppercase font-bold">Signal History</div>
              <div className="space-y-1 bg-slate-950/50 rounded p-2 max-h-32 overflow-y-auto">
                {signalLogs.map(log => (
                  <div
                    key={log.id}
                    className="text-[8px] text-white/60 font-mono flex justify-between px-2 py-0.5 rounded bg-slate-800/20"
                  >
                    <span className="text-white/40">{log.timestamp}</span>
                    <span className="text-yellow-400">{log.agent}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* System Stats */}
          <div className="space-y-2">
            <div className="text-[10px] text-white/40 uppercase font-bold">Performance</div>
            <div className="grid grid-cols-2 gap-2 text-[9px] bg-slate-950/50 rounded p-2">
              <div>
                <div className="text-white/40">Total Trades</div>
                <div className="text-white/80 font-bold">{stats.totalTrades}</div>
              </div>
              <div>
                <div className="text-white/40">Win Rate</div>
                <div className="text-emerald-400 font-bold">
                  {stats.totalTrades > 0
                    ? ((stats.wins / (stats.wins + stats.losses)) * 100).toFixed(1)
                    : '0'}
                  %
                </div>
              </div>
              <div>
                <div className="text-white/40">Total P&L</div>
                <div className={`font-bold ${stats.totalPnl > 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                  {stats.totalPnl.toFixed(2)}
                </div>
              </div>
              <div>
                <div className="text-white/40">Active</div>
                <div className="text-yellow-400 font-bold">{activeAgent || 'None'}</div>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="text-[7px] text-white/30 italic pt-2 border-t border-slate-700/30">
            Debug mode simulates agent triggers at realistic intervals. Manual triggers bypass timers.
          </div>
        </div>
      )}
    </div>
  );
}
