"use client";

import { Activity, ArrowDownRight, ArrowUpRight, BarChart3, Brain, DollarSign, FileText, RefreshCw, Sparkles, Target, TrendingUp, Zap } from 'lucide-react';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Area, AreaChart, Bar, BarChart, Cell, ReferenceLine, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';

// Smooth number animation component
function AnimatedNumber({ value, className }: { value: number; className: string }) {
  const [displayValue, setDisplayValue] = useState(value);
  const [isUpdating, setIsUpdating] = useState(false);
  const animationRef = useRef<NodeJS.Timeout>(undefined);

  useEffect(() => {
    if (displayValue !== value) {
      setIsUpdating(true);

      // Clear any existing animation
      if (animationRef.current) clearTimeout(animationRef.current);

      const startValue = displayValue;
      const diff = value - startValue;
      const duration = 400; // ms
      const startTime = Date.now();

      const animate = () => {
        const elapsed = Date.now() - startTime;
        const progress = Math.min(elapsed / duration, 1);

        // Ease-out cubic for smooth deceleration
        const easeProgress = 1 - Math.pow(1 - progress, 3);
        const currentValue = startValue + diff * easeProgress;

        setDisplayValue(Math.round(currentValue * 100) / 100);

        if (progress < 1) {
          animationRef.current = setTimeout(animate, 16);
        } else {
          setDisplayValue(value);
          setIsUpdating(false);
        }
      };

      animate();
    }

    return () => {
      if (animationRef.current) clearTimeout(animationRef.current);
    };
  }, [value, displayValue]);

  return (
    <span className={`${className} ${isUpdating ? 'pnl-update' : 'pnl-value'}`}>
      {displayValue >= 0 ? '+' : ''}{displayValue.toFixed(2)}
    </span>
  );
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

interface BotStats {
  totalTrades: number;
  wins: number;
  losses: number;
  winRate: number;
  totalPnl: number;
  currentStreak: number;
  milestone?: number;
}

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

interface ReportMetrics {
  totalTrades: number;
  winRate: number;
  wins: number;
  losses: number;
  totalPnL: number;
  avgTrade: number;
  avgWin: number;
  avgLoss: number;
  profitFactor: number;
  buyCount: number;
  sellCount: number;
  maxWinStreak: number;
  maxLossStreak: number;
}

interface Report {
  id: string;
  timestamp: string;
  tradeRange: { start: number; end: number };
  metrics: ReportMetrics;
  analysis: string;
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

const DEMO_STATS: BotStats = {
  totalTrades: 47,
  wins: 28,
  losses: 19,
  winRate: 59.6,
  totalPnl: 127.50,
  currentStreak: 3,
};

const DEMO_TRADES: Trade[] = [
  { id: '1', type: 'BUY', price: 1.17744, lot: 0.01, time: '2026-05-07 11:29:14', result: 'WIN', pnl: 12.30 },
  { id: '2', type: 'SELL', price: 1.17749, lot: 0.01, time: '2026-05-07 11:29:07', result: 'WIN', pnl: 8.50 },
  { id: '3', type: 'BUY', price: 1.17746, lot: 0.01, time: '2026-05-07 11:28:22', result: 'WIN', pnl: 15.20 },
  { id: '4', type: 'SELL', price: 1.17744, lot: 0.01, time: '2026-05-07 11:28:12', result: 'WIN', pnl: 5.80 },
  { id: '5', type: 'BUY', price: 1.17740, lot: 0.01, time: '2026-05-07 11:25:00', result: 'LOSS', pnl: -7.40 },
];

function PulsingDot() {
  return (
    <span className="relative flex h-2.5 w-2.5">
      <span className="animate-ping absolute inline-flex h-full w-full bg-emerald-400 opacity-75" />
      <span className="relative inline-flex h-2.5 w-2.5 bg-emerald-500" />
    </span>
  );
}

/* eslint-disable @typescript-eslint/no-explicit-any */
function ChartTooltipContent({ active, payload, label, type }: any) {
  if (!active || !payload?.length) return null;
  const value = payload[0].value;
  return (
    <div className="bg-[#0d1117] border border-white/10 px-3 py-2 text-xs shadow-xl">
      <div className="text-white/40 mb-1">{label}</div>
      <div className={`font-bold font-mono ${type === 'equity' ? 'text-cyan-400' : value >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
        {type === 'equity' ? '' : value >= 0 ? '+' : ''}{value.toFixed(2)} USD
      </div>
    </div>
  );
}
/* eslint-enable @typescript-eslint/no-explicit-any */

function ReportRow({ label, value, color }: { label: string; value: string; color?: string }) {
  return (
    <div className="flex items-center justify-between py-1.5 border-b border-white/[0.04] last:border-0">
      <span className="text-[10px] text-white/35 uppercase tracking-wider">{label}</span>
      <span className={`text-[11px] font-mono font-bold ${color || 'text-white/70'}`}>{value}</span>
    </div>
  );
}

export default function TradingBotDashboard() {
  const [stats, setStats] = useState<BotStats>(DEMO_STATS);
  const [openPositions, setOpenPositions] = useState<Trade[]>([]);
  const [history, setHistory] = useState<Trade[]>(DEMO_TRADES);
  const [version, setVersion] = useState('N/D');
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);
  const [loading, setLoading] = useState(true);
  const [aiAnalysis, setAiAnalysis] = useState<AIAnalysis | null>(null);
  const [newPositionIds, setNewPositionIds] = useState<Set<string>>(new Set());
  const [floatingPnL, setFloatingPnL] = useState<{ [key: string]: number }>({});
  const [report, setReport] = useState<any>(null);
  const [reportLoading, setReportLoading] = useState(false);
  const [reportHistory, setReportHistory] = useState<ReportHistory | null>(null);
  const [reportHistoryLoading, setReportHistoryLoading] = useState(false);
  const [expandedReport, setExpandedReport] = useState<string | null>(null);

  const fetchTrades = useCallback(async () => {
    try {
      const res = await fetch('/api/trading-bot');
      const data = await res.json();
      if (data.history || data.openPositions) {
        setStats(data.stats);
        setOpenPositions(data.openPositions || []);
        setHistory(data.history || []);
        if (data.version) setVersion(data.version);
        if (data.aiAnalysis) setAiAnalysis(data.aiAnalysis);
      }
    } catch (error) {
      console.error('Failed to fetch trades:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchReportHistory = useCallback(async () => {
    setReportHistoryLoading(true);
    try {
      const res = await fetch('/api/trading-bot/report-history');
      const data: ReportHistory = await res.json();
      setReportHistory(data);
      console.log('Notes loaded:', {
        has50Notes: !!data.notes50,
        has500Notes: !!data.notes500,
        hasGlobalRec: !!data.globalRecommendation,
        notes50Items: data.notes50?.items?.length || 0,
        notes500Items: data.notes500?.items?.length || 0
      });
    } catch (error) {
      console.error('Failed to fetch report history:', error);
    } finally {
      setReportHistoryLoading(false);
    }
  }, []);

  useEffect(() => {
    setLastUpdate(new Date());
    setLoading(true);

    // Fetch report history on mount and periodically
    fetchReportHistory();
    const reportHistoryInterval = setInterval(fetchReportHistory, 10000); // Refresh every 10s

    let tradesSource: EventSource | null = null;
    let positionsSource: EventSource | null = null;
    let fallbackInterval: NodeJS.Timeout | null = null;

    try {
      // Trades & stats stream (slower, 500ms)
      tradesSource = new EventSource('/api/trading-bot/stream');

      tradesSource.onopen = () => {
        console.log('Trades stream connected');
      };

      tradesSource.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          setStats(data.stats);
          setHistory(data.history || []);
          if (data.version) setVersion(data.version);
          setLastUpdate(new Date());
          setLoading(false);
          console.log('Trades update received:', {
            historyCount: data.history?.length || 0,
            stats: data.stats,
            version: data.version
          });
        } catch (error) {
          console.error('Failed to parse trades data:', error);
        }
      };

      tradesSource.onerror = (error) => {
        console.error('Trades stream error:', error);
        tradesSource?.close();
      };

      // Positions stream (faster, 50ms)
      positionsSource = new EventSource('/api/trading-bot/positions');

      positionsSource.onopen = () => {
        console.log('Positions stream connected');
      };

      positionsSource.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          const newPositions = data.openPositions || [];
          const pnlMap: { [key: string]: number } = {};

          newPositions.forEach((pos: Trade) => {
            // Use profit from EA (most accurate, real-time from MT5)
            if (pos.profit !== undefined) {
              pnlMap[pos.id] = pos.profit;
            } else if (pos.pnl !== undefined) {
              pnlMap[pos.id] = pos.pnl;
            }

            // Mark as new if not in previous positions
            setNewPositionIds(prev => {
              if (!prev.has(pos.id)) {
                const updated = new Set(prev);
                updated.add(pos.id);
                setTimeout(() => {
                  setNewPositionIds(p => {
                    const next = new Set(p);
                    next.delete(pos.id);
                    return next;
                  });
                }, 2000);
                return updated;
              }
              return prev;
            });
          });

          setOpenPositions(newPositions);
          setFloatingPnL(pnlMap);
          console.log('Positions update received', pnlMap);
        } catch (error) {
          console.error('Failed to parse positions data:', error);
        }
      };

      positionsSource.onerror = (error) => {
        console.error('Positions stream error:', error);
        positionsSource?.close();
      };
    } catch (error) {
      console.error('Failed to create streams:', error);
      fetchTrades();
      fallbackInterval = setInterval(fetchTrades, 5000);
    }

    return () => {
      tradesSource?.close();
      positionsSource?.close();
      if (fallbackInterval) clearInterval(fallbackInterval);
      clearInterval(reportHistoryInterval);
    };
  }, [fetchTrades, fetchReportHistory]);


  const refreshData = async () => {
    setLoading(true);
    await fetchTrades();
    setLastUpdate(new Date());
  };

  const generateReport = async (tradeCount: number) => {
    setReportLoading(true);
    try {
      const response = await fetch('/api/trading-bot/report', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tradeCount })
      });

      if (!response.ok) {
        const error = await response.json();
        setReport({ error: error.error || 'Failed to generate report' });
      } else {
        const data = await response.json();
        setReport(data);

        // Trigger notes update to save and evolve notes
        setTimeout(() => {
          fetch('/api/trading-bot/report-history', { method: 'POST' })
            .then(() => fetchReportHistory())
            .catch(err => console.error('Failed to update notes:', err));
        }, 500);
      }
    } catch (error) {
      setReport({ error: `Error: ${error instanceof Error ? error.message : 'Unknown error'}` });
    } finally {
      setReportLoading(false);
    }
  };

  const { pnlData, equityData, totalCommission, reports } = useMemo(() => {
    const chronological = [...history].reverse();
    let cumulative = 0;
    let totalComm = 0;
    let peak = 0;
    let maxDrawdown = 0;
    const pnl: { trade: string; pnl: number }[] = [];
    const equity: { trade: string; equity: number }[] = [];
    const wins: number[] = [];
    const losses: number[] = [];
    let bestTrade = -Infinity;
    let worstTrade = Infinity;
    let longestWinStreak = 0;
    let longestLoseStreak = 0;
    let curWinStreak = 0;
    let curLoseStreak = 0;

    chronological.forEach((t, i) => {
      const tradeLabel = `#${i + 1}`;
      const tradePnl = t.netProfit ?? t.pnl ?? (t.result === 'WIN' ? 10 : -10);
      const tradeComm = t.commission ?? 0;
      cumulative += tradePnl;
      totalComm += tradeComm;

      if (tradePnl > bestTrade) bestTrade = tradePnl;
      if (tradePnl < worstTrade) worstTrade = tradePnl;

      if (tradePnl >= 0) {
        wins.push(tradePnl);
        curWinStreak++;
        curLoseStreak = 0;
      } else {
        losses.push(tradePnl);
        curLoseStreak++;
        curWinStreak = 0;
      }
      if (curWinStreak > longestWinStreak) longestWinStreak = curWinStreak;
      if (curLoseStreak > longestLoseStreak) longestLoseStreak = curLoseStreak;

      if (cumulative > peak) peak = cumulative;
      const drawdown = peak - cumulative;
      if (drawdown > maxDrawdown) maxDrawdown = drawdown;

      pnl.push({ trade: tradeLabel, pnl: Math.round(tradePnl * 100) / 100 });
      equity.push({ trade: tradeLabel, equity: Math.round(cumulative * 100) / 100 });
    });

    const totalWins = wins.reduce((a, b) => a + b, 0);
    const totalLosses = Math.abs(losses.reduce((a, b) => a + b, 0));
    const profitFactor = totalLosses > 0 ? totalWins / totalLosses : totalWins > 0 ? Infinity : 0;
    const avgWin = wins.length > 0 ? totalWins / wins.length : 0;
    const avgLoss = losses.length > 0 ? totalLosses / losses.length : 0;
    const avgTrade = chronological.length > 0 ? cumulative / chronological.length : 0;
    const expectancy = chronological.length > 0
      ? (wins.length / chronological.length) * avgWin - (losses.length / chronological.length) * avgLoss
      : 0;

    return {
      pnlData: pnl,
      equityData: equity,
      totalCommission: totalComm,
      reports: {
        bestTrade: bestTrade === -Infinity ? 0 : bestTrade,
        worstTrade: worstTrade === Infinity ? 0 : worstTrade,
        avgWin,
        avgLoss,
        avgTrade,
        profitFactor,
        maxDrawdown,
        expectancy,
        longestWinStreak,
        longestLoseStreak,
        totalGrossProfit: totalWins,
        totalGrossLoss: totalLosses,
      },
    };
  }, [history]);

  return (
    <div className="h-screen overflow-hidden bg-[#06080f] text-white selection:bg-cyan-500/30 flex flex-col">
      {/* Ambient background glow */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-96 h-96 bg-cyan-500/[0.07] rounded-full blur-[120px]" />
        <div className="absolute top-1/3 -left-40 w-96 h-96 bg-violet-500/[0.05] rounded-full blur-[120px]" />
        <div className="absolute -bottom-40 right-1/3 w-96 h-96 bg-emerald-500/[0.05] rounded-full blur-[120px]" />
      </div>

      <div className="relative flex flex-col flex-1 min-h-0 w-full px-4 sm:px-6 lg:px-8 py-3">
        {/* Header + Inline Stats */}
        <header className="flex items-center justify-between mb-4 shrink-0">
          <div className="flex items-center gap-3">
            <div className="flex items-center justify-center w-8 h-8 bg-gradient-to-br from-cyan-500 to-emerald-500 shadow-lg shadow-cyan-500/20 rounded">
              <Zap className="w-4 h-4 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-lg font-semibold tracking-tight text-white">MikaBot</h1>
                <span className="text-[8px] font-mono px-1 py-0.5 bg-cyan-500/20 text-cyan-400">v{version}</span>
              </div>
              <div className="flex items-center gap-2 mt-0.5">
                <PulsingDot />
                <span className="text-[8px] font-medium text-white/40 uppercase tracking-wider">Live</span>
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
              onClick={refreshData}
              disabled={loading}
              className="flex items-center justify-center w-7 h-7 bg-white/[0.03] hover:bg-white/[0.06] border border-white/[0.05] rounded transition-all disabled:opacity-40 cursor-pointer"
            >
              <RefreshCw className={`w-3 h-3 text-white/40 hover:text-white/60 transition-colors ${loading ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </header>

        {/* Charts Row: Equity (large) + P&L sparkline (small) */}
        <div className="grid grid-cols-3 gap-2 mb-3 shrink-0" style={{ height: '140px' }}>
          {/* Equity Curve — 2 cols */}
          <div className="col-span-2 bg-white/[0.02] border border-white/[0.05] flex flex-col min-h-0 rounded">
            <div className="flex items-center justify-between px-3 py-1 border-b border-white/[0.05] shrink-0">
              <div className="flex items-center gap-1.5">
                <TrendingUp className="w-3 h-3 text-cyan-400/40" />
                <h2 className="text-[10px] font-semibold text-white/50 tracking-wide">Equity</h2>
              </div>
              {equityData.length > 0 && (
                <span className={`text-[9px] font-mono font-bold ${equityData[equityData.length - 1]?.equity >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                  {equityData[equityData.length - 1]?.equity >= 0 ? '+' : ''}{equityData[equityData.length - 1]?.equity.toFixed(2)}
                </span>
              )}
            </div>
            <div className="flex-1 min-h-0 px-2 py-1">
              {equityData.length === 0 ? (
                <div className="flex items-center justify-center h-full text-white/20 text-xs">No data yet</div>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={equityData} margin={{ top: 4, right: 4, bottom: 0, left: -20 }}>
                    <defs>
                      <linearGradient id="equityGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="rgba(34,211,238,0.4)" />
                        <stop offset="100%" stopColor="rgba(34,211,238,0)" />
                      </linearGradient>
                    </defs>
                    <XAxis dataKey="trade" tick={{ fill: 'rgba(255,255,255,0.2)', fontSize: 9 }} axisLine={{ stroke: 'rgba(255,255,255,0.06)' }} tickLine={false} />
                    <YAxis tick={{ fill: 'rgba(255,255,255,0.2)', fontSize: 9 }} axisLine={false} tickLine={false} />
                    <Tooltip content={<ChartTooltipContent type="equity" />} />
                    <ReferenceLine y={0} stroke="rgba(255,255,255,0.1)" strokeDasharray="3 3" />
                    <Area type="monotone" dataKey="equity" stroke="rgba(34,211,238,0.8)" strokeWidth={2} fill="url(#equityGradient)" />
                  </AreaChart>
                </ResponsiveContainer>
              )}
            </div>
          </div>

          {/* P&L Per Trade — 1 col, compact */}
          <div className="bg-white/[0.02] border border-white/[0.05] flex flex-col min-h-0 rounded">
            <div className="flex items-center px-3 py-1 border-b border-white/[0.05] shrink-0">
              <BarChart3 className="w-3 h-3 text-white/25 mr-1" />
              <h2 className="text-[10px] font-semibold text-white/40 tracking-wide">P&L</h2>
            </div>
            <div className="flex-1 min-h-0 px-1 py-1">
              {pnlData.length === 0 ? (
                <div className="flex items-center justify-center h-full text-white/20 text-[10px]">No data</div>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={pnlData} margin={{ top: 2, right: 2, bottom: 0, left: -25 }}>
                    <XAxis dataKey="trade" tick={false} axisLine={{ stroke: 'rgba(255,255,255,0.06)' }} tickLine={false} />
                    <YAxis tick={{ fill: 'rgba(255,255,255,0.15)', fontSize: 8 }} axisLine={false} tickLine={false} />
                    <Tooltip content={<ChartTooltipContent type="pnl" />} cursor={{ fill: 'rgba(255,255,255,0.03)' }} />
                    <ReferenceLine y={0} stroke="rgba(255,255,255,0.08)" />
                    <Bar dataKey="pnl" radius={0}>
                      {pnlData.map((entry, index) => (
                        <Cell key={index} fill={entry.pnl >= 0 ? 'rgba(52,211,153,0.6)' : 'rgba(248,113,113,0.6)'} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              )}
            </div>
          </div>
        </div>

        {/* Main Content: AI Insights + Reports | Metrics | Trade History */}
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-2 flex-1 min-h-0">

          {/* AI Insights + Report + Notes — 3 columns */}
          <div className="lg:col-span-3 bg-white/[0.02] border border-white/[0.05] flex flex-col min-h-0 rounded">
            <div className="flex items-center justify-between px-4 py-2 border-b border-white/[0.05] shrink-0">
              <div className="flex items-center gap-2">
                <Brain className="w-3.5 h-3.5 text-violet-400/60" />
                <h2 className="text-[11px] font-semibold text-white/70 tracking-wide">AI & Reports</h2>
              </div>
            </div>
            <div className="flex-1 min-h-0 overflow-y-auto p-4">
              <div className="grid grid-cols-1 lg:grid-cols-9 gap-3 h-full">
                {/* Left: Live Analysis or Session Summary — 2 cols */}
                {aiAnalysis ? (
                  <div className="lg:col-span-2 bg-gradient-to-br from-violet-500/[0.08] to-purple-500/[0.03] border border-violet-500/[0.12] p-4 flex-1">
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
                            {aiAnalysis.patterns.map((p, i) => (
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
                  <div className="lg:col-span-2 bg-gradient-to-br from-cyan-500/[0.08] to-blue-500/[0.03] border border-white/[0.05] p-4 flex-1 flex flex-col">
                    {/* Session Summary Section */}
                    <div className="pb-3">
                      <div className="flex items-center gap-2 mb-3">
                        <Activity className="w-3.5 h-3.5 text-cyan-400/60" />
                        <span className="text-[10px] font-bold text-white/70 uppercase tracking-wider">Session Summary</span>
                      </div>

                      <div className="grid grid-cols-2 gap-3">
                        {/* Left stats */}
                        <div className="space-y-2">
                          <div>
                            <div className="text-[8px] text-white/40 uppercase mb-1">Win Rate</div>
                            <div className="text-xl font-bold text-emerald-400">{stats.winRate}%</div>
                          </div>
                          <div>
                            <div className="text-[8px] text-white/40 uppercase mb-1">Avg Trade</div>
                            <div className={`text-base font-bold ${reports.avgTrade >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                              ${reports.avgTrade.toFixed(2)}
                            </div>
                          </div>
                        </div>

                        {/* Right stats */}
                        <div className="space-y-2">
                          <div>
                            <div className="text-[8px] text-white/40 uppercase mb-1">Today P&L</div>
                            <div className={`text-xl font-bold ${stats.totalPnl >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                              {stats.totalPnl >= 0 ? '+' : ''}{stats.totalPnl.toFixed(2)}
                            </div>
                          </div>
                          <div>
                            <div className="text-[8px] text-white/40 uppercase mb-1">Profit Factor</div>
                            <div className={`text-base font-bold ${reports.profitFactor >= 1 ? 'text-emerald-400' : 'text-red-400'}`}>
                              {reports.profitFactor === Infinity ? '∞' : reports.profitFactor.toFixed(2)}
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Divider */}
                    <div className="h-px bg-white/[0.05] my-3" />

                    {/* Session Performance Section */}
                    <div className="pt-3 pb-3">
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

                    <div className="pt-3 border-t border-white/[0.05] text-[8px] text-white/40">
                      <div className="flex items-center gap-1">
                        <span>📊 {stats.totalTrades} trades</span>
                        <span>•</span>
                        <span>{stats.wins}W {stats.losses}L</span>
                      </div>
                    </div>
                  </div>
                )}

                {/* Middle: Recommendations + Open Positions — 2 cols */}
                <div className="lg:col-span-2 flex flex-col gap-3">

                  <div className="bg-gradient-to-br from-amber-500/[0.06] to-orange-500/[0.02] border border-amber-500/[0.08] p-3">
                    <div className="flex items-center gap-2 mb-1.5">
                      <div className="w-1.5 h-1.5 rounded-full bg-amber-400" />
                      <span className="text-[10px] font-bold text-amber-300/80 uppercase tracking-wider">Recommendation</span>
                    </div>
                    <p className="text-[11px] leading-relaxed text-white/50">
                      {stats.winRate > 55
                        ? 'Strategy performing above baseline. Continue monitoring for consistency.'
                        : 'Need more data for reliable pattern analysis. Keep trading to improve accuracy.'}
                    </p>
                  </div>

                  {openPositions.length > 0 && (
                    <div className="bg-white/[0.03] border border-cyan-500/[0.1] p-3 flex-1 min-h-0">
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
                        @keyframes pnlFlicker {
                          0%, 100% { opacity: 1; }
                          50% { opacity: 0.85; }
                        }
                        .pnl-value {
                          transition: all 0.4s cubic-bezier(0.34, 1.56, 0.64, 1);
                          font-variant-numeric: tabular-nums;
                        }
                        .pnl-update {
                          animation: pnlPulse 0.6s ease-out;
                        }
                        .position-new {
                          animation: slideInGlow 0.5s ease-out;
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
                        {openPositions.map((pos, i) => {
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

                {/* Report — 1 col */}
                <div className="lg:col-span-1 bg-white/[0.02] border border-white/[0.05] flex flex-col min-h-0 rounded">
                  <div className="flex items-center gap-1.5 px-4 py-2 border-b border-white/[0.05] shrink-0">
                    <Brain className="w-3 h-3 text-violet-400/50" />
                    <h3 className="text-[10px] font-semibold text-white/50 tracking-wide">Report</h3>
                  </div>

                  <div className="overflow-y-auto flex-1 min-h-0 px-3 py-2 flex flex-col gap-2">
                    {!report ? (
                      <>
                        {/* 50-Trade Progress */}
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

                        {/* 500-Trade Progress */}
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
                          onClick={() => setReport(null)}
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

                        <button
                          onClick={() => setReport(null)}
                          className="w-full px-2 py-1 text-[7px] text-white/40 hover:text-white/60 transition-colors"
                        >
                          Close
                        </button>
                      </>
                    )}
                  </div>
                </div>

                {/* Master Recommendation — 1 col */}
                {reportHistory && reportHistory.globalRecommendation && (
                  <div className="lg:col-span-1 bg-white/[0.02] border border-white/[0.05] flex flex-col min-h-0 rounded">
                    <div className="flex items-center gap-2 px-3 py-2 border-b border-white/[0.05] shrink-0">
                      <Sparkles className="w-3 h-3 text-violet-400/40" />
                      <h3 className="text-[9px] font-semibold text-white/50 tracking-wide">Master</h3>
                    </div>
                    <div className="overflow-y-auto flex-1 min-h-0 p-3 flex flex-col gap-2">
                      <div className="bg-white/[0.03] border border-violet-500/[0.15] p-2 rounded flex-1 min-h-0">
                        <p className="text-[8px] leading-relaxed text-white/70">
                          {reportHistory.globalRecommendation.recommendation}
                        </p>
                      </div>
                      {reportHistory.globalRecommendation.keyInsights && reportHistory.globalRecommendation.keyInsights.length > 0 && (
                        <div className="space-y-1 text-[7px] text-white/50">
                          {reportHistory.globalRecommendation.keyInsights.slice(0, 2).map((insight, i) => (
                            <div key={i} className="flex gap-1">
                              <span className="text-violet-400 shrink-0">•</span>
                              <span className="line-clamp-2">{insight}</span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* 50-Trade Notes — 1 col */}
                {reportHistory && (reportHistory.notes50?.items?.length ?? 0) > 0 && (
                  <div className="lg:col-span-1 bg-white/[0.02] border border-white/[0.05] flex flex-col min-h-0 rounded">
                    <div className="flex items-center gap-2 px-3 py-2 border-b border-white/[0.05] shrink-0">
                      <Target className="w-3 h-3 text-cyan-400/40" />
                      <h3 className="text-[9px] font-semibold text-white/50 tracking-wide">50T</h3>
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

                {/* 500-Trade Notes — 1 col */}
                {reportHistory && (reportHistory.notes500?.items?.length ?? 0) > 0 && (
                  <div className="lg:col-span-1 bg-white/[0.02] border border-white/[0.05] flex flex-col min-h-0 rounded">
                    <div className="flex items-center gap-2 px-3 py-2 border-b border-white/[0.05] shrink-0">
                      <TrendingUp className="w-3 h-3 text-amber-400/40" />
                      <h3 className="text-[9px] font-semibold text-white/50 tracking-wide">500T</h3>
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
            </div>
          </div>

          {/* Reports — 1 column */}
          <div className="bg-white/[0.02] border border-white/[0.05] flex flex-col min-h-0 rounded">
            <div className="flex items-center gap-1.5 px-4 py-2 border-b border-white/[0.05] shrink-0">
              <FileText className="w-3 h-3 text-white/25" />
              <h2 className="text-[10px] font-semibold text-white/50 tracking-wide">Metrics</h2>
            </div>
            <div className="overflow-y-auto flex-1 min-h-0 px-4 py-2">
              {history.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-white/20">
                  <FileText className="w-5 h-5 mb-1.5 opacity-40" />
                  <p className="text-[10px]">Need trade data to generate reports.</p>
                </div>
              ) : (
                <div>
                  {/* Key Metrics */}
                  <div className="mb-3">
                    <span className="text-[9px] font-bold text-white/25 uppercase tracking-widest">Profitability</span>
                    <div className="mt-1.5">
                      <ReportRow label="Profit Factor" value={reports.profitFactor === Infinity ? '∞' : reports.profitFactor.toFixed(2)} color={reports.profitFactor >= 1 ? 'text-emerald-400' : 'text-red-400'} />
                      <ReportRow label="Expectancy" value={`${reports.expectancy >= 0 ? '+' : ''}${reports.expectancy.toFixed(2)}`} color={reports.expectancy >= 0 ? 'text-emerald-400' : 'text-red-400'} />
                      <ReportRow label="Avg Trade" value={`${reports.avgTrade >= 0 ? '+' : ''}${reports.avgTrade.toFixed(2)}`} color={reports.avgTrade >= 0 ? 'text-emerald-400' : 'text-red-400'} />
                      <ReportRow label="Gross Profit" value={`+${reports.totalGrossProfit.toFixed(2)}`} color="text-emerald-400" />
                      <ReportRow label="Gross Loss" value={`-${reports.totalGrossLoss.toFixed(2)}`} color="text-red-400" />
                    </div>
                  </div>

                  {/* Trade Analysis */}
                  <div className="mb-3">
                    <span className="text-[9px] font-bold text-white/25 uppercase tracking-widest">Trade Analysis</span>
                    <div className="mt-1.5">
                      <ReportRow label="Best Trade" value={`+${reports.bestTrade.toFixed(2)}`} color="text-emerald-400" />
                      <ReportRow label="Worst Trade" value={reports.worstTrade.toFixed(2)} color="text-red-400" />
                      <ReportRow label="Avg Win" value={`+${reports.avgWin.toFixed(2)}`} color="text-emerald-400/70" />
                      <ReportRow label="Avg Loss" value={`-${reports.avgLoss.toFixed(2)}`} color="text-red-400/70" />
                    </div>
                  </div>

                  {/* Risk */}
                  <div className="mb-3">
                    <span className="text-[9px] font-bold text-white/25 uppercase tracking-widest">Risk</span>
                    <div className="mt-1.5">
                      <ReportRow label="Max Drawdown" value={`-${reports.maxDrawdown.toFixed(2)}`} color="text-red-400" />
                      <ReportRow label="Best Streak" value={`${reports.longestWinStreak}W`} color="text-emerald-400/70" />
                      <ReportRow label="Worst Streak" value={`${reports.longestLoseStreak}L`} color="text-red-400/70" />
                    </div>
                  </div>

                  {/* Commission */}
                  {totalCommission !== 0 && (
                    <div>
                      <span className="text-[9px] font-bold text-white/25 uppercase tracking-widest">Costs</span>
                      <div className="mt-1.5">
                        <ReportRow label="Total Commission" value={totalCommission.toFixed(2)} color="text-amber-400/70" />
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Trade History — 1 column */}
          <div className="bg-white/[0.02] border border-white/[0.05] flex flex-col min-h-0 rounded">
            <div className="flex items-center justify-between px-4 py-2 border-b border-white/[0.05] shrink-0">
              <div className="flex items-center gap-1.5">
                <Activity className="w-3 h-3 text-white/25" />
                <h2 className="text-[10px] font-semibold text-white/50 tracking-wide">History</h2>
              </div>
              <span className="text-[8px] text-white/20 font-mono">{history.length}</span>
            </div>
            <div className="divide-y divide-white/[0.04] overflow-y-auto flex-1 min-h-0">
              {history.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-white/25">
                  <Activity className="w-5 h-5 mb-1.5 opacity-50" />
                  <p className="text-[10px]">No closed trades yet.</p>
                </div>
              ) : (
                history.slice(-20).map((trade, index) => (
                  <div
                    key={trade.id || index}
                    className="flex items-center justify-between px-4 py-2 hover:bg-white/[0.02] transition-colors duration-200"
                  >
                    <div className="flex items-center gap-2">
                      <div className={`flex items-center justify-center w-5 h-5 ${
                        trade.type === 'BUY' ? 'bg-emerald-500/10 text-emerald-400' : 'bg-red-500/10 text-red-400'
                      }`}>
                        {trade.type === 'BUY' ? <ArrowUpRight className="w-2.5 h-2.5" /> : <ArrowDownRight className="w-2.5 h-2.5" />}
                      </div>
                      <div>
                        <div className="flex items-center gap-1">
                          <span className={`text-[9px] font-bold uppercase ${trade.type === 'BUY' ? 'text-emerald-400' : 'text-red-400'}`}>
                            {trade.type}
                          </span>
                          <span className="text-[10px] font-mono text-white/70">
                            {trade.openPrice ? (
                              <>{trade.openPrice.toFixed(5)}<span className="text-white/20">&rarr;</span>{trade.price.toFixed(5)}</>
                            ) : trade.price.toFixed(5)}
                          </span>
                        </div>
                        <div className="text-[8px] text-white/20 font-mono">{trade.time}</div>
                      </div>
                    </div>
                    <div className="flex items-center gap-1.5">
                      {trade.netProfit !== undefined ? (
                        <div className="text-right">
                          <span className={`text-[10px] font-mono font-bold ${trade.netProfit >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                            {trade.netProfit >= 0 ? '+' : ''}{trade.netProfit.toFixed(2)}
                          </span>
                          {trade.commission !== undefined && Math.abs(trade.commission) > 0.001 && (
                            <div className="text-[8px] text-amber-400">
                              {trade.commission < 0 ? trade.commission.toFixed(2) : `-${trade.commission.toFixed(2)}`}
                            </div>
                          )}
                        </div>
                      ) : trade.pnl !== undefined ? (
                        <span className={`text-[10px] font-mono font-bold ${trade.pnl >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                          {trade.pnl >= 0 ? '+' : ''}{trade.pnl.toFixed(2)}
                        </span>
                      ) : null}
                      {trade.result && (
                        <span className={`inline-flex items-center px-1 py-0.5 text-[7px] font-bold uppercase tracking-wider ${
                          trade.result === 'WIN'
                            ? 'bg-emerald-500/10 text-emerald-400 ring-1 ring-emerald-500/20'
                            : 'bg-red-500/10 text-red-400 ring-1 ring-red-500/20'
                        }`}>
                          {trade.result}
                        </span>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

        </div>


        {/* Footer */}
        <footer className="mt-2 flex items-center justify-center shrink-0">
          <span className="text-[8px] text-white/10">MikaBot</span>
        </footer>
      </div>
    </div>
  );
}
