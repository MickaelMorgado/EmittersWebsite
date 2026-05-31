import { Activity, Zap } from "lucide-react";

interface SummarySectionProps {
  aiAnalysis: any;
  stats: any;
  reports: any;
}

export default function SummarySection({ aiAnalysis, stats, reports }: SummarySectionProps) {
  return (
    <>
      {aiAnalysis ? (
            <div className="bg-gradient-to-br from-violet-500/[0.08] to-purple-500/[0.03] border border-violet-500/[0.12] p-4 rounded">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <Zap className="w-3.5 h-3.5 text-violet-400" />
                  <span className="text-[10px] font-bold text-violet-300 uppercase tracking-wider">Live Signal</span>
                </div>
                <span className={`text-xs font-bold px-2 py-0.5 ${
                  aiAnalysis.signal === 'BUY' ? 'bg-emerald-500/20 text-emerald-400 ring-1 ring-emerald-500/20' :
                  aiAnalysis.signal === 'SELL' ? 'bg-red-500/20 text-red-400 ring-1 ring-red-500/20' :
                  'bg-white/10 text-white/40'
                }`}>
                  {aiAnalysis.signal}
                </span>
              </div>
              <div className="space-y-2.5">
                <div className="flex items-baseline justify-between">
                  <span className="text-2xl font-bold font-mono text-white/90">{aiAnalysis.price.toFixed(5)}</span>
                  <span className="text-xs text-white/40">{aiAnalysis.symbol}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] uppercase text-white/30 tracking-wider">Trend</span>
                  <span className={`text-xs font-medium ${
                    aiAnalysis.trend.toLowerCase().includes('bull') ? 'text-emerald-400' :
                    aiAnalysis.trend.toLowerCase().includes('bear') ? 'text-red-400' : 'text-white/60'
                  }`}>{aiAnalysis.trend}</span>
                </div>
                {aiAnalysis.patterns.length > 0 && (
                  <div>
                    <span className="text-[10px] uppercase text-white/30 tracking-wider">Patterns</span>
                    <div className="flex gap-1.5 flex-wrap mt-1">
                      {aiAnalysis.patterns.map((p: string, i: number) => (
                        <span key={i} className="text-[10px] px-2 py-0.5 bg-white/[0.05] text-white/50 border border-white/[0.06]">{p}</span>
                      ))}
                    </div>
                  </div>
                )}
                <div className="grid grid-cols-2 gap-3 pt-1">
                  <div>
                    <span className="text-[10px] uppercase text-white/30 tracking-wider">RSI</span>
                    <div className="text-base font-bold font-mono text-white/80 mt-0.5">{aiAnalysis.rsi?.toFixed(1) || 'N/A'}</div>
                  </div>
                  <div>
                    <span className="text-[10px] uppercase text-white/30 tracking-wider">Confidence</span>
                    <div className="text-base font-bold font-mono text-violet-400 mt-0.5">{aiAnalysis.confidence}%</div>
                  </div>
                </div>
                {aiAnalysis.reasoning && (
                  <div className="pt-2 border-t border-white/[0.05]">
                    <span className="text-[10px] uppercase text-white/30 tracking-wider">Reasoning</span>
                    <p className="text-[11px] leading-relaxed text-white/45 mt-1">{aiAnalysis.reasoning}</p>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="col-span-6 bg-gradient-to-br from-cyan-500/[0.08] to-blue-500/[0.03] border border-white/[0.05] p-4 rounded">
              <div className="flex items-center gap-2 mb-4">
                <Activity className="w-3.5 h-3.5 text-cyan-400/60" />
                <span className="text-[10px] font-bold text-white/70 uppercase tracking-wider">Session Summary</span>
              </div>
              <div className="grid grid-cols-2 gap-6 mb-3">
                {/* Session Summary Column */}
                <div>
                  <div className="flex items-center gap-2 mb-3">
                    <div className="w-1.5 h-1.5 rounded-full bg-cyan-400" />
                    <span className="text-[10px] font-bold text-cyan-300/80 uppercase tracking-wider">Profitability</span>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <div className="text-[8px] text-white/40 uppercase">Win Rate</div>
                      <div className="text-xl font-bold text-emerald-400">{stats.winRate}%</div>
                    </div>
                    <div>
                      <div className="text-[8px] text-white/40 uppercase">Avg Trade</div>
                      <div className={`text-base font-bold ${reports.avgTrade >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                        ${reports.avgTrade.toFixed(2)}
                      </div>
                    </div>
                    <div>
                      <div className="text-[8px] text-white/40 uppercase">Today P&L</div>
                      <div className={`text-xl font-bold ${stats.totalPnl >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                        {stats.totalPnl >= 0 ? '+' : ''}{stats.totalPnl.toFixed(2)}
                      </div>
                    </div>
                    <div>
                      <div className="text-[8px] text-white/40 uppercase">Profit Factor</div>
                      <div className={`text-base font-bold ${reports.profitFactor >= 1 ? 'text-emerald-400' : 'text-red-400'}`}>
                        {reports.profitFactor === Infinity ? '∞' : reports.profitFactor.toFixed(2)}
                      </div>
                    </div>
                  </div>
                </div>
                {/* Trade Analysis Column */}
                <div>
                  <div className="flex items-center gap-2 mb-3">
                    <div className="w-1.5 h-1.5 rounded-full bg-cyan-400" />
                    <span className="text-[10px] font-bold text-cyan-300/80 uppercase tracking-wider">Trade Analysis</span>
                  </div>
                  <div className="grid grid-cols-2 gap-x-4 gap-y-2">
                    <div>
                      <div className="text-[9px] text-white/30 uppercase tracking-wider">Best Trade</div>
                      <div className="text-base font-bold font-mono text-emerald-400">+{reports.bestTrade.toFixed(2)}</div>
                    </div>
                    <div>
                      <div className="text-[9px] text-white/30 uppercase tracking-wider">Worst Trade</div>
                      <div className="text-base font-bold font-mono text-red-400">{reports.worstTrade.toFixed(2)}</div>
                    </div>
                    <div>
                      <div className="text-[9px] text-white/30 uppercase tracking-wider">Avg Win</div>
                      <div className="text-base font-bold font-mono text-emerald-400">+{reports.avgWin.toFixed(2)}</div>
                    </div>
                    <div>
                      <div className="text-[9px] text-white/30 uppercase tracking-wider">Avg Loss</div>
                      <div className="text-base font-bold font-mono text-red-400">-{reports.avgLoss.toFixed(2)}</div>
                    </div>
                  </div>
                </div>
              </div>
              <div className="pt-3 border-t border-white/[0.05] text-[8px] text-white/40">
                <div className="flex items-center gap-1">
                  <span>📊 {stats.totalTrades} trades</span>
                  <span>•</span>
                  <span>{stats.wins}W {stats.losses}L</span>
                </div>
              </div>
            </div>
          )}
        </>
      );
    }