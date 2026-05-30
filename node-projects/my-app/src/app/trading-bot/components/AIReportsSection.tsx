"use client";

import { Activity, Brain, Sparkles, Target, TrendingUp } from 'lucide-react';
import SummarySection from './SummarySection';

interface AIAnalysis {
  timestamp: string;
  symbol: string;
  price: number;
  trend: string;
  patterns: string[];
  rsi: number | null;
  confidence: number;
  signal: string;
  reasoning: string;
}

interface Trade {
  id: string;
  type: string;
  price: number;
  openPrice?: number;
  lot: number;
  time: string;
  result?: 'WIN' | 'LOSS';
  pnl?: number;
  profit?: number;
  commission?: number;
  netProfit?: number;
  isOpen?: boolean;
}

interface ReportMetrics {
  bestTrade: number;
  worstTrade: number;
  avgWin: number;
  avgLoss: number;
  avgTrade: number;
  profitFactor: number;
  maxDrawdown: number;
  expectancy: number;
  longestWinStreak: number;
  longestLoseStreak: number;
  totalGrossProfit: number;
  totalGrossLoss: number;
}

interface NoteItem {
  id: string;
  content: string;
  addedAt: string;
  lastUpdatedAt: string;
  status: 'active' | 'deprecated';
}

interface Notes {
  cycleNumber: number;
  totalTrades: number;
  generatedAt: string;
  items: NoteItem[];
  summary: string;
}

interface GlobalRecommendation {
  lastUpdatedAt: string;
  totalTrades: number;
  recommendation: string;
  keyInsights: string[];
}

interface ReportHistory {
  notes50: Notes | null;
  notes500: Notes | null;
  globalRecommendation: GlobalRecommendation | null;
}

interface BotStats {
  totalTrades: number;
  wins: number;
  losses: number;
  winRate: number;
  totalPnl: number;
  currentStreak: number;
}

interface AIReportsSectionProps {
  aiAnalysis: AIAnalysis | null;
  openPositions: Trade[];
  floatingPnL: { [key: string]: number };
  newPositionIds: Set<string>;
  stats: BotStats;
  reports: ReportMetrics;
  history: Trade[];
  report: any;
  reportLoading: boolean;
  reportHistory: ReportHistory | null;
  generateReport: (tradeCount: number) => void;
  onCloseReport: () => void;
}

function AnimatedNumber({ value, className }: { value: number; className: string }) {
  return (
    <span className={className}>
      {value >= 0 ? '+' : ''}{value.toFixed(2)}
    </span>
  );
}

export default function AIReportsSection({
  aiAnalysis,
  openPositions,
  floatingPnL,
  newPositionIds,
  stats,
  reports,
  history,
  report,
  reportLoading,
  reportHistory,
  generateReport,
  onCloseReport,
}: AIReportsSectionProps) {
  return (
    <div className="col-span-5 bg-white/[0.02] border border-white/[0.05] flex flex-col min-h-0 rounded h-full">
      <div className="flex items-center justify-between px-4 py-2 border-b border-white/[0.05] shrink-0">
        <div className="flex items-center gap-2">
          <Brain className="w-3.5 h-3.5 text-violet-400/60" />
          <h2 className="text-[11px] font-semibold text-white/70 tracking-wide">AI & Reports</h2>
        </div>
      </div>
      <div className="flex-1 min-h-0 overflow-y-auto p-4">
        <div className="grid grid-cols-6 gap-3 h-auto auto-rows-max">
          {/* Middle: Recommendations + Open Positions — 2 cols */}
          <div className="col-span-3 flex flex-col gap-3">

            {/* Sub-Agent Reports */}
            <div className="grid grid-cols-2 gap-2">
              {/* Risk Management Agent */}
              <div className="bg-gradient-to-br from-red-500/[0.06] to-rose-500/[0.02] border border-red-500/[0.1] p-2 rounded">
                <div className="flex items-center justify-between gap-1.5 mb-1">
                  <span className="text-[8px] font-bold text-red-300/80 uppercase tracking-wider">Risk</span>
                  <span className="text-[8px] font-bold text-red-400 font-mono">
                    {reports.maxDrawdown > stats.totalPnl * 0.5 ? '0' : '25'}%
                  </span>
                </div>
                <div className="h-0.5 bg-white/[0.05] rounded overflow-hidden mb-1">
                  <div
                    className="h-full bg-red-500"
                    style={{ width: `${reports.maxDrawdown > stats.totalPnl * 0.5 ? 0 : 100}%` }}
                  />
                </div>
                <p className="text-[8px] leading-tight text-white/45">
                  {reports.maxDrawdown > stats.totalPnl * 0.5
                    ? '⚠️ High drawdown detected'
                    : '✓ Risk within limits'}
                </p>
              </div>

              {/* Probability & Trend Agent */}
              <div className="bg-gradient-to-br from-cyan-500/[0.06] to-blue-500/[0.02] border border-cyan-500/[0.1] p-2 rounded">
                <div className="flex items-center justify-between gap-1.5 mb-1">
                  <span className="text-[8px] font-bold text-cyan-300/80 uppercase tracking-wider">Trend</span>
                  <span className="text-[8px] font-bold text-cyan-400 font-mono">
                    {reports.longestWinStreak > 3 ? '25' : reports.longestLoseStreak > 3 ? '0' : '12'}%
                  </span>
                </div>
                <div className="h-0.5 bg-white/[0.05] rounded overflow-hidden mb-1">
                  <div
                    className="h-full bg-cyan-500"
                    style={{
                      width: `${
                        reports.longestWinStreak > 3 ? 100 : reports.longestLoseStreak > 3 ? 0 : 48
                      }%`
                    }}
                  />
                </div>
                <p className="text-[8px] leading-tight text-white/45">
                  {reports.longestWinStreak > 3
                    ? '📈 Strong uptrend'
                    : reports.longestLoseStreak > 3
                    ? '📉 Downtrend caution'
                    : '◼ Neutral trend'}
                </p>
              </div>

              {/* Economic News Agent */}
              <div className="bg-gradient-to-br from-violet-500/[0.06] to-purple-500/[0.02] border border-violet-500/[0.1] p-2 rounded">
                <div className="flex items-center justify-between gap-1.5 mb-1">
                  <span className="text-[8px] font-bold text-violet-300/80 uppercase tracking-wider">News</span>
                  <span className="text-[8px] font-bold text-violet-400 font-mono">25%</span>
                </div>
                <div className="h-0.5 bg-white/[0.05] rounded overflow-hidden mb-1">
                  <div className="h-full bg-violet-500" style={{ width: '100%' }} />
                </div>
                <p className="text-[8px] leading-tight text-white/45">
                  No major news events
                </p>
              </div>

              {/* History & Reports Agent */}
              <div className="bg-gradient-to-br from-emerald-500/[0.06] to-green-500/[0.02] border border-emerald-500/[0.1] p-2 rounded">
                <div className="flex items-center justify-between gap-1.5 mb-1">
                  <span className="text-[8px] font-bold text-emerald-300/80 uppercase tracking-wider">History</span>
                  <span className="text-[8px] font-bold text-emerald-400 font-mono">
                    {stats.totalTrades > 100 ? '25' : stats.totalTrades > 50 ? '15' : '0'}%
                  </span>
                </div>
                <div className="h-0.5 bg-white/[0.05] rounded overflow-hidden mb-1">
                  <div
                    className="h-full bg-emerald-500"
                    style={{
                      width: `${
                        stats.totalTrades > 100 ? 100 : stats.totalTrades > 50 ? 60 : 0
                      }%`
                    }}
                  />
                </div>
                <p className="text-[8px] leading-tight text-white/45">
                  {stats.totalTrades > 100 ? '📊 Sufficient data' : '⏳ Need more trades'}
                </p>
              </div>
            </div>
            
            {/* Master Agent */}
            <div className="bg-gradient-to-br from-amber-500/[0.06] to-orange-500/[0.02] border border-amber-500/[0.08] p-3">
              <div className="flex items-center gap-2 mb-2">
                <div className="w-1.5 h-1.5 rounded-full bg-amber-400" />
                <span className="text-[10px] font-bold text-amber-300/80 uppercase tracking-wider">Master Recommendation</span>
              </div>

              {/* Decision Percentile */}
              <div className="mb-2.5">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-[8px] text-white/30 uppercase">Trade Decision</span>
                  <span className={`text-[10px] font-bold font-mono ${
                    (() => {
                      const riskOk = reports.maxDrawdown <= stats.totalPnl * 0.5 ? 25 : 0;
                      const trendOk = reports.longestWinStreak > 3 ? 25 : reports.longestLoseStreak > 3 ? 0 : 12;
                      const newsOk = 25;
                      const historyOk = stats.totalTrades > 100 ? 25 : stats.totalTrades > 50 ? 15 : 0;
                      const total = riskOk + trendOk + newsOk + historyOk;
                      return total >= 75 ? 'text-emerald-400' : total >= 50 ? 'text-yellow-400' : 'text-red-400';
                    })()
                  }`}>
                    {(() => {
                      const riskOk = reports.maxDrawdown <= stats.totalPnl * 0.5 ? 25 : 0;
                      const trendOk = reports.longestWinStreak > 3 ? 25 : reports.longestLoseStreak > 3 ? 0 : 12;
                      const newsOk = 25;
                      const historyOk = stats.totalTrades > 100 ? 25 : stats.totalTrades > 50 ? 15 : 0;
                      return riskOk + trendOk + newsOk + historyOk;
                    })()}%
                  </span>
                </div>
                <div className="w-full h-1.5 bg-white/[0.05] rounded overflow-hidden border border-white/[0.08]">
                  <div
                    className={`h-full transition-all duration-300 ${
                      (() => {
                        const riskOk = reports.maxDrawdown <= stats.totalPnl * 0.5 ? 25 : 0;
                        const trendOk = reports.longestWinStreak > 3 ? 25 : reports.longestLoseStreak > 3 ? 0 : 12;
                        const newsOk = 25;
                        const historyOk = stats.totalTrades > 100 ? 25 : stats.totalTrades > 50 ? 15 : 0;
                        const total = riskOk + trendOk + newsOk + historyOk;
                        return total >= 75 ? 'bg-gradient-to-r from-emerald-500 to-emerald-400' : total >= 50 ? 'bg-gradient-to-r from-yellow-500 to-yellow-400' : 'bg-gradient-to-r from-red-500 to-red-400';
                      })()
                    }`}
                    style={{
                      width: `${(() => {
                        const riskOk = reports.maxDrawdown <= stats.totalPnl * 0.5 ? 25 : 0;
                        const trendOk = reports.longestWinStreak > 3 ? 25 : reports.longestLoseStreak > 3 ? 0 : 12;
                        const newsOk = 25;
                        const historyOk = stats.totalTrades > 100 ? 25 : stats.totalTrades > 50 ? 15 : 0;
                        return riskOk + trendOk + newsOk + historyOk;
                      })()}%`
                    }}
                  />
                </div>
              </div>

              <p className="text-[9px] leading-relaxed text-white/50">
                {(() => {
                  const riskOk = reports.maxDrawdown <= stats.totalPnl * 0.5 ? 25 : 0;
                  const trendOk = reports.longestWinStreak > 3 ? 25 : reports.longestLoseStreak > 3 ? 0 : 12;
                  const newsOk = 25;
                  const historyOk = stats.totalTrades > 100 ? 25 : stats.totalTrades > 50 ? 15 : 0;
                  const total = riskOk + trendOk + newsOk + historyOk;

                  return total >= 75
                    ? '✓ APPROVED: High confidence for next trade'
                    : total >= 50
                    ? '⚠ CAUTION: Moderate approval, monitor closely'
                    : '✗ BLOCKED: Low confidence, wait for better conditions';
                })()}
              </p>
            </div>
          </div>

          <div className="col-span-2">    
            {openPositions.length > 0 && (
              <div className="bg-white/[0.03] border border-cyan-500/[0.1] p-3 flex-1 min-h-0 h-full">
                <style>{`
                  @keyframes slideInGlow {
                    from {
                      opacity: 0;
                      transform: translateX(-10px);
                      box-shadow: 0 0 20px rgba(34, 211, 238, 0.8);
                    }
                    to {
                      opacity: 1;
                      transform: translateX(0);
                      box-shadow: 0 0 0 rgba(34, 211, 238, 0);
                    }
                  }
                  @keyframes pnlPulse {
                    0% {
                      transform: scale(1);
                      filter: drop-shadow(0 0 0px currentColor);
                    }
                    50% {
                      transform: scale(1.05);
                      filter: drop-shadow(0 0 8px currentColor);
                    }
                    100% {
                      transform: scale(1);
                      filter: drop-shadow(0 0 0px currentColor);
                    }
                  }
                  .position-new {
                    animation: slideInGlow 0.5s ease-out;
                  }
                  .pnl-value {
                    transition: all 0.4s cubic-bezier(0.34, 1.56, 0.64, 1);
                    font-variant-numeric: tabular-nums;
                  }
                  .pnl-update {
                    animation: pnlPulse 0.6s ease-out;
                  }
                `}</style>
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <Activity className="w-3 h-3 text-cyan-400/60" />
                    <span className="text-[10px] font-bold text-cyan-300/80 uppercase tracking-wider">Open Positions</span>
                  </div>
                  <span className="text-[9px] text-cyan-400/40 font-mono">{openPositions.length} active</span>
                </div>
                <div className="space-y-1 overflow-y-auto max-h-28">
                  {openPositions.map((pos: Trade, i: number) => {
                    const isNew = newPositionIds.has(pos.id);
                    const pnl = floatingPnL[pos.id] || 0;
                    const pnlColor = pnl >= 0 ? 'text-emerald-400' : 'text-red-400';
                    return (
                      <div
                        key={pos.id || i}
                        className={`flex items-center justify-between py-1.5 px-2 border border-cyan-500/[0.1] rounded transition-all ${
                          isNew ? 'position-new bg-cyan-500/10' : 'border-white/[0.04]'
                        } last:border-0`}
                      >
                        <div className="flex items-center gap-2 flex-1">
                          <span className={`text-[10px] font-bold ${pos.type === 'BUY' ? 'text-emerald-400' : 'text-red-400'}`}>
                            {pos.type}
                          </span>
                          <div className="flex flex-col flex-1">
                            <span className="text-[11px] font-mono text-white/70">{pos.price.toFixed(5)}</span>
                            <span className="text-[8px] text-white/40 font-mono">{pos.time}</span>
                          </div>
                        </div>
                        <div className="text-right">
                          <AnimatedNumber
                            value={pnl}
                            className={`text-[10px] font-mono font-bold transition-colors duration-300 ${pnlColor}`}
                          />
                          <div className="text-[8px] text-white/30">Floating</div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

           {/* Report — 2 cols */}
           <div className="col-span-1 bg-white/[0.02] border border-white/[0.05] flex flex-col min-h-0 rounded">
             <div className="flex items-center gap-1.5 px-4 py-2 border-b border-white/[0.05] shrink-0">
               <Brain className="w-3 h-3 text-violet-400/50" />
               <h3 className="text-[10px] font-semibold text-white/50 tracking-wide">Report</h3>
             </div>
             <div className="overflow-y-auto flex-1 min-h-0 px-3 py-2 flex flex-col gap-2">
               {!report ? (
                 <>
                   <div className="space-y-1">
                     <div className="flex items-center justify-between">
                       <span className="text-[7px] text-white/40 uppercase">50-Trade</span>
                       <span className="text-[7px] text-white/30 font-mono">{Math.min(history.length, 50)}/50</span>
                     </div>
                     <div className="w-full h-1.5 bg-white/[0.05] rounded overflow-hidden border border-white/[0.08]">
                       <div
                         className="h-full bg-gradient-to-r from-cyan-500 to-cyan-400 transition-all duration-300"
                         style={{ width: `${Math.min((history.length / 50) * 100, 100)}%` }}
                       />
                     </div>
                     <button
                       onClick={() => generateReport(50)}
                       disabled={reportLoading || history.length < 50}
                       className="w-full px-3 py-1.5 bg-white/[0.05] hover:bg-white/[0.08] disabled:opacity-40 disabled:cursor-not-allowed border border-white/[0.08] rounded text-[8px] font-semibold text-white/70 transition-colors"
                     >
                       {reportLoading ? '⏳ Analyzing...' : history.length >= 50 ? 'Generate Report' : 'Need 50 Trades'}
                     </button>
                   </div>
                   <div className="space-y-1">
                     <div className="flex items-center justify-between">
                       <span className="text-[7px] text-white/40 uppercase">500-Trade</span>
                       <span className="text-[7px] text-white/30 font-mono">{Math.min(history.length, 500)}/500</span>
                     </div>
                     <div className="w-full h-1.5 bg-white/[0.05] rounded overflow-hidden border border-white/[0.08]">
                       <div
                         className="h-full bg-gradient-to-r from-amber-500 to-amber-400 transition-all duration-300"
                         style={{ width: `${Math.min((history.length / 500) * 100, 100)}%` }}
                       />
                     </div>
                     <button
                       onClick={() => generateReport(500)}
                       disabled={reportLoading || history.length < 500}
                       className="w-full px-3 py-1.5 bg-white/[0.05] hover:bg-white/[0.08] disabled:opacity-40 disabled:cursor-not-allowed border border-white/[0.08] rounded text-[8px] font-semibold text-white/70 transition-colors"
                     >
                       {reportLoading ? '⏳ Analyzing...' : history.length >= 500 ? 'Generate Report' : 'Need 500 Trades'}
                     </button>
                   </div>
                 </>
               ) : report.error ? (
                 <>
                   <div className="text-[8px] text-red-400 p-1.5 bg-red-500/10 rounded border border-red-500/15">
                     {report.error}
                   </div>
                   <button
                     onClick={onCloseReport}
                     className="w-full px-2 py-1 text-[7px] text-white/40 hover:text-white/60 transition-colors"
                   >
                     Close
                   </button>
                 </>
               ) : (
                 <>
                   <div className="space-y-1.5 flex-1 min-h-0 overflow-y-auto">
                     <div className="bg-white/[0.03] border border-white/[0.05] p-1.5 rounded">
                       <div className="text-[7px] font-bold text-white/50 mb-1 uppercase">Metrics</div>
                       <div className="space-y-0.5 text-[7px] text-white/50 font-mono">
                         <div className="flex justify-between">
                           <span>WR:</span>
                           <span className="text-emerald-400">{report.metrics?.winRate}%</span>
                         </div>
                         <div className="flex justify-between">
                           <span>P&L:</span>
                           <span className={report.metrics?.totalPnL >= 0 ? 'text-emerald-400' : 'text-red-400'}>
                             ${report.metrics?.totalPnL}
                           </span>
                         </div>
                         <div className="flex justify-between">
                           <span>PF:</span>
                           <span>{report.metrics?.profitFactor}</span>
                         </div>
                       </div>
                     </div>
                     <div className="bg-white/[0.03] border border-white/[0.05] p-1.5 rounded flex-1 min-h-0 overflow-y-auto">
                       <div className="text-[7px] font-bold text-white/50 mb-1 uppercase">Analysis</div>
                       <p className="text-[7px] leading-relaxed text-white/45">
                         {report.analysis}
                       </p>
                     </div>
                   </div>
                   
                   {/* Master Recommendation Section */}
                   {reportHistory && reportHistory.globalRecommendation && (
                     <div className="mt-4 pt-3 border-t border-white/[0.05]">
                       <div className="flex items-center gap-2 mb-2">
                         <Sparkles className="w-3 h-3 text-violet-400/40" />
                         <h3 className="text-[9px] font-semibold text-white/50 tracking-wide">Master</h3>
                       </div>
                       <div className="bg-white/[0.03] border border-violet-500/[0.15] p-3 rounded">
                         <p className="text-[8px] leading-relaxed text-white/70">
                           {reportHistory.globalRecommendation.recommendation}
                         </p>
                       </div>
                       {reportHistory.globalRecommendation.keyInsights && reportHistory.globalRecommendation.keyInsights.length > 0 && (
                         <div className="mt-3 space-y-1 text-[7px] text-white/50">
                           {reportHistory.globalRecommendation.keyInsights.slice(0, 2).map((insight, i) => (
                             <div key={i} className="flex gap-1">
                               <span className="text-violet-400 shrink-0">•</span>
                               <span className="line-clamp-2">{insight}</span>
                             </div>
                           ))}
                         </div>
                       )}
                     </div>
                   )}
                   
                   <button
                     onClick={onCloseReport}
                     className="w-full px-2 py-1 text-[7px] text-white/40 hover:text-white/60 transition-colors mt-4"
                   >
                     Close
                   </button>
                 </>
               )}
             </div>
           </div>

          {/* Reports Vertical Stack — 1 col, spans full height */}
          {reportHistory && ((reportHistory.notes50?.items?.length ?? 0) > 0 || (reportHistory.notes500?.items?.length ?? 0) > 0) && (
            <div className="col-span-1 flex flex-col gap-3 min-h-0">
              {/* 50-Trade Notes */}
              {(reportHistory.notes50?.items?.length ?? 0) > 0 && (
                <div className="bg-white/[0.02] border border-white/[0.05] flex flex-col min-h-0 rounded">
                  <div className="flex items-center gap-2 px-3 py-2 border-b border-white/[0.05] shrink-0">
                    <Target className="w-3 h-3 text-cyan-400/40" />
                    <h3 className="text-[9px] font-semibold text-white/50 tracking-wide">50-Trade</h3>
                  </div>
                  <div className="overflow-y-auto flex-1 min-h-0 p-3 space-y-2">
                    {reportHistory.notes50?.items
                      .filter(item => item.status === 'active')
                      .slice(0, 3)
                      .map((item) => (
                        <div key={item.id} className="bg-white/[0.02] border border-cyan-500/[0.1] p-2 rounded">
                          <p className="text-[7.5px] text-white/60 leading-tight">{item.content}</p>
                        </div>
                      ))}
                  </div>
                </div>
              )}

              {/* 500-Trade Notes */}
              {(reportHistory.notes500?.items?.length ?? 0) > 0 && (
                <div className="bg-white/[0.02] border border-white/[0.05] flex flex-col min-h-0 rounded">
                  <div className="flex items-center gap-2 px-3 py-2 border-b border-white/[0.05] shrink-0">
                    <TrendingUp className="w-3 h-3 text-amber-400/40" />
                    <h3 className="text-[9px] font-semibold text-white/50 tracking-wide">500-Trade</h3>
                  </div>
                  <div className="overflow-y-auto flex-1 min-h-0 p-3 space-y-2">
                    {reportHistory.notes500?.items
                      .filter(item => item.status === 'active')
                      .slice(0, 3)
                      .map((item) => (
                        <div key={item.id} className="bg-white/[0.02] border border-amber-500/[0.1] p-2 rounded">
                          <p className="text-[7.5px] text-white/60 leading-tight">{item.content}</p>
                        </div>
                      ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Left: Live Analysis or Session Summary — 6 cols */}
          <SummarySection aiAnalysis={aiAnalysis} stats={stats} reports={reports} />
        </div>
      </div>
    </div>
  );
}
