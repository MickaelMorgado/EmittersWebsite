"use client";

import { Shield } from 'lucide-react';

interface XmStats {
  totalTrades: number;
  wins: number;
  losses: number;
  winRate: number;
  totalPnl: number;
}

interface RiskLimitsCardProps {
  stats: XmStats;
}

function RiskRow({ label, value, color }: { label: string; value: string; color?: string }) {
  return (
    <div className="flex items-center justify-between py-1 border-b border-white/[0.04] last:border-0">
      <span className="text-[10px] text-white/35 uppercase tracking-wider">{label}</span>
      <span className={`text-[11px] font-mono font-bold ${color || 'text-white/60'}`}>{value}</span>
    </div>
  );
}

export default function RiskLimitsCard({ stats }: RiskLimitsCardProps) {
  const balance = 50 + stats.totalPnl;
  const dailyLoss = Math.abs(Math.min(0, stats.totalPnl));
  const riskStatus = dailyLoss > 2 ? 'BREACH' : dailyLoss > 1 ? 'WARNING' : 'OK';
  const statusColor = riskStatus === 'OK' ? 'text-emerald-400' : riskStatus === 'WARNING' ? 'text-amber-400' : 'text-red-400';

  return (
    <div className="col-span-1 bg-white/[0.02] border border-white/[0.05] flex flex-col min-h-0 rounded h-full">
      <div className="flex items-center justify-between px-3 py-1 border-b border-white/[0.05] shrink-0">
        <div className="flex items-center gap-1">
          <Shield className="w-3 h-3 text-violet-400/40" />
          <h2 className="text-[10px] font-semibold text-white/50 tracking-wide">Risk Limits</h2>
        </div>
        <span className={`text-[10px] font-mono font-bold ${statusColor}`}>{riskStatus}</span>
      </div>
      <div className="overflow-y-auto flex-1 min-h-0 px-3 py-2">
        <div className="mb-2">
          <span className="text-[10px] font-bold text-white/25 uppercase tracking-widest">Account</span>
          <div className="mt-1">
            <RiskRow label="Balance" value={`€${balance.toFixed(2)}`} color={balance >= 50 ? 'text-emerald-400' : 'text-red-400'} />
            <RiskRow label="P/L" value={`${stats.totalPnl >= 0 ? '+' : ''}€${stats.totalPnl.toFixed(2)}`} color={stats.totalPnl >= 0 ? 'text-emerald-400' : 'text-red-400'} />
          </div>
        </div>
        <div className="mb-2">
          <span className="text-[10px] font-bold text-white/25 uppercase tracking-widest">Limits</span>
          <div className="mt-1">
            <RiskRow label="Daily Max" value="-€2.00 (4%)" />
            <RiskRow label="Weekly Max" value="-€5.00 (10%)" />
            <RiskRow label="Monthly Max" value="-€10.00 (20%)" />
          </div>
        </div>
        <div>
          <span className="text-[10px] font-bold text-white/25 uppercase tracking-widest">Usage</span>
          <div className="mt-1">
            <RiskRow label="Daily Used" value={`-€${dailyLoss.toFixed(2)}`} color={dailyLoss > 2 ? 'text-red-400' : 'text-white/60'} />
            <RiskRow label="Weekly Used" value={`-€${dailyLoss.toFixed(2)}`} color={dailyLoss > 5 ? 'text-red-400' : 'text-white/60'} />
            <RiskRow label="Monthly Used" value={`-€${dailyLoss.toFixed(2)}`} color={dailyLoss > 10 ? 'text-red-400' : 'text-white/60'} />
          </div>
        </div>
      </div>
    </div>
  );
}
