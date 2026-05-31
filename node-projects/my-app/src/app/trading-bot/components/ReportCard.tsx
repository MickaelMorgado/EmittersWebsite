"use client";

import { Brain, Sparkles, Target, TrendingUp } from 'lucide-react';

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

interface ReportCardProps {
  report: any;
  reportLoading: boolean;
  reportHistory: ReportHistory | null;
  onCloseReport: () => void;
  history: Trade[];
}

export default function ReportCard({
  report,
  reportLoading,
  reportHistory,
  onCloseReport,
  history,
}: ReportCardProps) {
  return (
    <>
      {/* Main Report Card */}
      <div className="bg-white/[0.02] border border-white/[0.05] flex flex-col min-h-0 rounded">
        <div className="flex items-center gap-1.5 px-4 py-2 border-b border-white/[0.05] shrink-0">
          <Brain className="w-3 h-3 text-violet-400/50" />
          <h3 className="text-[10px] font-semibold text-white/50 tracking-wide">Report</h3>
        </div>
        <div className="overflow-y-auto flex-1 min-h-0 px-3 py-2 flex flex-col gap-2">
          {!report ? (
            <>
              <div className="space-y-1.5">
                <div className="text-[8px] font-bold text-white/60 uppercase">Report Milestones</div>

                {/* 50-Trade Milestone */}
                <div className="bg-white/[0.02] border border-cyan-500/[0.1] p-2 rounded">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-[7px] text-cyan-400/80 uppercase font-semibold">50-Trade</span>
                    <span className="text-[7px] text-white/30 font-mono">{history.length}/50</span>
                  </div>
                  <div className="w-full h-1 bg-white/[0.05] rounded overflow-hidden border border-white/[0.08]">
                    <div
                      className="h-full bg-gradient-to-r from-cyan-500 to-cyan-400 transition-all duration-300"
                      style={{ width: `${Math.min((history.length / 50) * 100, 100)}%` }}
                    />
                  </div>
                  {history.length < 50 && (
                    <div className="text-[7px] text-white/40 mt-1">
                      {50 - history.length} trades until report
                    </div>
                  )}
                  {history.length >= 50 && (
                    <div className="text-[7px] text-cyan-400 mt-1">
                      ✓ History Agent auto-generating...
                    </div>
                  )}
                </div>

                {/* 500-Trade Milestone */}
                <div className="bg-white/[0.02] border border-amber-500/[0.1] p-2 rounded">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-[7px] text-amber-400/80 uppercase font-semibold">500-Trade</span>
                    <span className="text-[7px] text-white/30 font-mono">{history.length}/500</span>
                  </div>
                  <div className="w-full h-1 bg-white/[0.05] rounded overflow-hidden border border-white/[0.08]">
                    <div
                      className="h-full bg-gradient-to-r from-amber-500 to-amber-400 transition-all duration-300"
                      style={{ width: `${Math.min((history.length / 500) * 100, 100)}%` }}
                    />
                  </div>
                  {history.length < 500 && (
                    <div className="text-[7px] text-white/40 mt-1">
                      {500 - history.length} trades until report
                    </div>
                  )}
                  {history.length >= 500 && (
                    <div className="text-[7px] text-amber-400 mt-1">
                      ✓ History Agent auto-generating...
                    </div>
                  )}
                </div>
              </div>

              <div className="pt-1.5 border-t border-white/[0.05] text-[7px] text-white/40">
                <p>History Agent automatically generates reports at each milestone.</p>
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

      {/* Report History — Notes 50 & 500 */}
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
    </>
  );
}
