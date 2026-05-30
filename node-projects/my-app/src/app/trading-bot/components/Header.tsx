"use client";

import { Activity, DollarSign, RefreshCw, Target, Zap, Bug } from 'lucide-react';

interface BotStats {
  totalTrades: number;
  wins: number;
  losses: number;
  winRate: number;
  totalPnl: number;
  currentStreak: number;
  milestone?: number;
}

interface HeaderProps {
  version: string;
  stats: BotStats;
  loading: boolean;
  onRefresh: () => void;
  debugMode?: boolean;
  onDebugToggle?: (enabled: boolean) => void;
}

function PulsingDot() {
  return (
    <span className="relative flex h-2.5 w-2.5">
      <span className="animate-ping absolute inline-flex h-full w-full bg-emerald-400 opacity-75" />
      <span className="relative inline-flex h-2.5 w-2.5 bg-emerald-500" />
    </span>
  );
}

export default function Header({ version, stats, loading, onRefresh, debugMode = false, onDebugToggle }: HeaderProps) {
  return (
    <header className="flex items-center justify-between mb-4 shrink-0">
      <div className="flex items-center gap-3">
        <div className="flex items-center justify-center w-8 h-8 bg-gradient-to-br from-cyan-500 to-emerald-500 shadow-lg shadow-cyan-500/20 rounded">
          <Zap className="w-4 h-4 text-white" />
        </div>
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-lg font-semibold tracking-tight text-white">MikaBot</h1>
            <span className="text-[8px] font-mono px-1 py-0.5 bg-cyan-500/20 text-cyan-400">v{version}</span>
            {debugMode && (
              <span className="text-[8px] font-mono px-1.5 py-0.5 bg-orange-500/30 text-orange-400 rounded flex items-center gap-1">
                <Bug className="w-2.5 h-2.5" />
                DEBUG
              </span>
            )}
          </div>
          <div className="flex items-center gap-2 mt-0.5">
            <PulsingDot />
            <span className="text-[8px] font-medium text-white/40 uppercase tracking-wider">{debugMode ? 'Debug Mode' : 'Live'}</span>
          </div>
        </div>
      </div>

      {/* Compact Stats Strip */}
      <div className="flex items-center gap-2">
        <div className="flex items-center gap-3 px-3 py-1.5 bg-white/[0.02] border border-white/[0.05] rounded">
          <div className="flex items-center gap-1">
            <Activity className="w-3 h-3 text-cyan-400/50" />
            <span className="text-[9px] text-white/35 uppercase tracking-wider">T</span>
            <span className="text-xs font-bold text-white/80 font-mono">{stats.totalTrades}</span>
          </div>
          <div className="w-px h-3 bg-white/[0.05]" />
          <div className="flex items-center gap-1">
            <Target className="w-3 h-3 text-emerald-400/50" />
            <span className="text-[9px] text-white/35 uppercase">WR</span>
            <span className="text-xs font-bold text-emerald-400 font-mono">{stats.winRate}%</span>
          </div>
          <div className="w-px h-3 bg-white/[0.05]" />
          <div className="flex items-center gap-1">
            <DollarSign className="w-3 h-3 text-emerald-400/50" />
            <span className="text-[9px] text-white/35 uppercase">P&L</span>
            <span className={`text-xs font-bold font-mono ${stats.totalPnl >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
              {stats.totalPnl >= 0 ? '+' : ''}{stats.totalPnl.toFixed(2)}
            </span>
          </div>
        </div>

        <button
          onClick={() => onDebugToggle?.(!debugMode)}
          className={`flex items-center justify-center w-7 h-7 border rounded transition-all cursor-pointer ${
            debugMode
              ? 'bg-orange-500/20 border-orange-500/30 hover:bg-orange-500/30'
              : 'bg-white/[0.03] border-white/[0.05] hover:bg-white/[0.06]'
          }`}
          title={debugMode ? 'Disable Debug Mode' : 'Enable Debug Mode'}
        >
          <Bug className={`w-3 h-3 transition-colors ${debugMode ? 'text-orange-400' : 'text-white/40'}`} />
        </button>

        <button
          onClick={onRefresh}
          disabled={loading}
          className="flex items-center justify-center w-7 h-7 bg-white/[0.03] hover:bg-white/[0.06] border border-white/[0.05] rounded transition-all disabled:opacity-40 cursor-pointer"
        >
          <RefreshCw className={`w-3 h-3 text-white/40 hover:text-white/60 transition-colors ${loading ? 'animate-spin' : ''}`} />
        </button>
      </div>
    </header>
  );
}
