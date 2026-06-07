"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import AgentReportsModal from './components/AgentReportsModal';
import AIReportsSection from './components/AIReportsSection';
import DebugPanel from './components/DebugPanel';
import EquityChart from './components/EquityChart';
import Header from './components/Header';
import MetricsSection from './components/MetricsSection';
import PnLChart from './components/PnLChart';
import TradeHistorySection from './components/TradeHistorySection';

interface Trade {
  id: string;
  type: string;
  price: number;
  openPrice?: number;
  stopLoss?: number;
  takeProfit?: number;
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

interface SimulatedAgentOutput {
  trend: {
    direction: 'BUY' | 'SELL' | 'NEUTRAL';
    score: number;
    ma_9?: number;
    ma_21?: number;
    ma_50?: number;
    ma_50_trend?: 'Uptrend' | 'Downtrend' | 'Neutral';
    crossover_status?: 'UP' | 'DOWN' | 'NONE';
    entry_allowed?: boolean;
    reasoning?: string;
    // Timezone-safe candle age: seconds-since-open as computed by the server
    // from the broker's own two clocks, plus the local Date.now() at the
    // moment we fetched it — together these let the card tick up live
    // (candle_age_seconds + elapsed-since-measured_at) without ever needing
    // to compare a broker timestamp directly to the browser's clock.
    candle_age_seconds?: number;
    candle_age_measured_at?: number;
  };
  history: { rrTarget: string; consistency: number; score: number };
  risk: { slDistance: number; tpRatio: string; positionSize: string; score: number };
  news: { sentiment: 'Bullish' | 'Neutral' | 'Bearish'; volatility: number; score: number; approved?: boolean; high_impact_count?: number; rejection_reason?: string | null; plain_summary?: string | null };
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

export default function TradingBotDashboard() {
  const [stats, setStats] = useState<BotStats>(DEMO_STATS);
  const [openPositions, setOpenPositions] = useState<Trade[]>([]);
  const [history, setHistory] = useState<Trade[]>(DEMO_TRADES);
  const [version, setVersion] = useState('N/D');
  const [loading, setLoading] = useState(true);
  const [aiAnalysis, setAiAnalysis] = useState<AIAnalysis | null>(null);
  const [newPositionIds, setNewPositionIds] = useState<Set<string>>(new Set());
  const seenPositionIds = useRef<Set<string>>(new Set());
  // Trend Agent trigger — fires once per new candle (ma_timestamp change)
  const lastCandleTimestamp = useRef<string>('');
  const [floatingPnL, setFloatingPnL] = useState<{ [key: string]: number }>({});
  const [report, setReport] = useState<any>(null);
  const [reportLoading, setReportLoading] = useState(false);
  const [reportHistory, setReportHistory] = useState<ReportHistory | null>(null);
  const [debugMode, setDebugMode] = useState(false);
  const [lastSignal, setLastSignal] = useState<{ signal: string; timestamp: string } | null>(null);
  const [simulatedAgents, setSimulatedAgents] = useState<SimulatedAgentOutput | null>(null);
  const [reportsModalOpen, setReportsModalOpen] = useState(false);
  const [latestNews, setLatestNews] = useState<any[]>([]);

  const addReport = useCallback(async (agent: string, message: string, data?: any, action?: string) => {
    try {
      await fetch('/api/trading-bot/agent-reports', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ agent, message, data, action }),
      });
    } catch (error) {
      console.error('Failed to add report:', error);
    }
  }, []);

  const fetchNews = useCallback(async () => {
    try {
      const res = await fetch('/api/trading-bot/news');
      const data = await res.json();

      if (!data.error && data.news && data.news.length > 0) {
        setLatestNews(data.news);

        // ── Run News Agent (pure math — no LLM) ─────────────────────────────
        try {
          const agentRes = await fetch('/api/trading-bot/agents/news', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ news: data.news }),
          });

          if (agentRes.ok) {
            const agentData = await agentRes.json();
            console.log(
              `[NEWS AGENT] ${agentData.approved ? '✓ APPROVED' : '✗ REJECTED'} | ` +
              `Sentiment: ${agentData.sentiment} | VIX-proxy: ${agentData.volatility} | ` +
              `High-impact: ${agentData.high_impact_count}`
            );

            setSimulatedAgents(prev => {
              const base: SimulatedAgentOutput = prev || {
                trend:   { direction: 'NEUTRAL', score: 0 },
                history: { rrTarget: '1:3', consistency: 0, score: 0 },
                risk:    { slDistance: 0, tpRatio: '1:3', positionSize: '0.02', score: 0 },
                news:    { sentiment: 'Neutral', volatility: 0, score: 0 },
              };
              return {
                ...base,
                news: {
                  sentiment:         agentData.sentiment,
                  volatility:        agentData.volatility,
                  score:             agentData.score,
                  approved:          agentData.approved,
                  high_impact_count: agentData.high_impact_count,
                  rejection_reason:  agentData.rejection_reason ?? null,
                  plain_summary:     agentData.plain_summary ?? null,
                },
              };
            });

            addReport(
              'news',
              agentData.approved
                ? `📰 ${data.news[0].title.substring(0, 60)}...`
                : `⚠️ News block: ${agentData.rejection_reason}`,
              {
                sentiment:        agentData.sentiment,
                volatility:       agentData.volatility,
                high_impact:      agentData.high_impact_count,
                approved:         agentData.approved,
                rejection_reason: agentData.rejection_reason,
              },
              `${agentData.approved ? 'APPROVED' : 'REJECTED'} | ${agentData.sentiment} | VIX ${agentData.volatility}`
            );
          }
        } catch (agentErr) {
          console.error('[NEWS AGENT] Failed:', agentErr);
        }

        console.log(`[NEWS] ✓ ${data.news.length} items at ${new Date().toLocaleTimeString()}`);
      } else if (data.error) {
        console.warn('News API error:', data.error);
      }
    } catch (error) {
      console.error('Failed to fetch news:', error);
    }
  }, [addReport]);

  const generateDebugSignal = useCallback(async () => {
    const timestamp = new Date().toISOString();

    // Simulate agent outputs
    const trendDirections: ('BUY' | 'SELL' | 'NEUTRAL')[] = ['BUY', 'SELL', 'NEUTRAL'];
    const trendDir = trendDirections[Math.floor(Math.random() * 3)];
    const trendScore = Math.floor(Math.random() * 26); // 0-25

    const rrTargets = ['1:1.5', '1:3', '1:4', '1:6'];
    const rrTarget = rrTargets[Math.floor(Math.random() * 4)];
    const historyScore = Math.floor(Math.random() * 26); // 0-25
    const consistency = 50 + Math.floor(Math.random() * 50); // 50-100%

    const slDistances = [1.0, 1.5, 2.0, 2.5];
    const slDist = slDistances[Math.floor(Math.random() * 4)];
    const tpRatios = ['1:1.5', '1:3', '1:4', '1:6'];
    const tpRatio = tpRatios[Math.floor(Math.random() * 4)];
    const positionSizes = ['0.01', '0.02', '0.03', '0.05'];
    const posSize = positionSizes[Math.floor(Math.random() * 4)];
    const riskScore = Math.floor(Math.random() * 26); // 0-25

    const sentiments: ('Bullish' | 'Neutral' | 'Bearish')[] = ['Bullish', 'Neutral', 'Bearish'];
    const sentiment = sentiments[Math.floor(Math.random() * 3)];
    const volatility = 10 + Math.floor(Math.random() * 20); // 10-30 (VIX-like)
    const newsScore = Math.floor(Math.random() * 26); // 0-25

    // Generate sample MA values for debug display
    const baseMa50 = 45000 + Math.random() * 1000; // Current MA50
    const ma50Trend = trendDir === 'BUY' ? 'Uptrend' : trendDir === 'SELL' ? 'Downtrend' : 'Neutral';
    const crossoverStatus = trendDir === 'BUY' ? 'UP' : trendDir === 'SELL' ? 'DOWN' : 'NONE';

    const simulated: SimulatedAgentOutput = {
      trend: {
        direction: trendDir,
        score: trendScore,
        ma_9: baseMa50 + (Math.random() * 200 - 100),    // MA9 near MA50
        ma_21: baseMa50 + (Math.random() * 150 - 75),     // MA21 near MA50
        ma_50: baseMa50,                                   // MA50 base
        ma_50_trend: ma50Trend,
        crossover_status: crossoverStatus,
        entry_allowed: trendScore > 10 && crossoverStatus !== 'NONE'
      },
      history: { rrTarget, consistency, score: historyScore },
      risk: { slDistance: slDist, tpRatio, positionSize: posSize, score: riskScore },
      news: { sentiment, volatility, score: newsScore }
    };

    const totalScore = trendScore + historyScore + riskScore + newsScore;
    const masterDecision = totalScore >= 75
      ? (trendDir === 'BUY' ? 'BUY' : trendDir === 'SELL' ? 'SELL' : 'NEUTRAL')
      : 'NEUTRAL';

    // AGENT COMMUNICATION FLOW:
    // History Agent → passes R:R ratio based on market regime analysis
    const rrMatch = rrTarget.match(/1:(\d+\.?\d*)/);
    const rrRatio = rrMatch ? parseFloat(rrMatch[1]) : 1.5;
    console.log(`[HISTORY→RISK] Passing R:R ratio: ${rrTarget} (${rrRatio}:1) based on market regime`);

    // Risk Agent → uses History's R:R to calculate final TP from its SL
    const baseSlPips = slDist * 100; // Convert to pips (e.g., 1.0 → 100 pips)
    const slPips = Math.max(Math.round(baseSlPips), 50); // Minimum 50 pips for broker compliance
    const tpPips = Math.round(slPips * rrRatio); // TP = SL × R:R (from History Agent)
    const posSize_num = parseFloat(posSize);

    console.log(`[RISK AGENT] Calculated: SL=${slPips}pips, TP=${tpPips}pips (using History's R:R), Size=${posSize}`);

    // Master Agent → aggregates all signals
    const confidence = (totalScore / 100) * 100; // Convert to percentage

    setSimulatedAgents(simulated);
    setLastSignal({ signal: masterDecision, timestamp });

    console.log(`
[SIGNAL GENERATION] ${new Date(timestamp).toLocaleTimeString()}
├─ Trend Agent:    ${trendDir} (${trendScore}pts)
├─ History Agent:  Regime Analysis → R:R=${rrTarget} (${consistency}% consistency) (${historyScore}pts)
│   └→ [PASSES R:R RATIO TO RISK AGENT]
├─ Risk Agent:     SL=${slPips}pips, TP=${tpPips}pips (from History's R:R), Size=${posSize} (${riskScore}pts)
│   └→ [PASSES SL/TP/SIZE TO MASTER AGENT]
├─ News Agent:     ${sentiment}, VIX ${volatility} (${newsScore}pts)
└─ Master Gate:    ${totalScore}pts/100 → Confidence: ${confidence.toFixed(0)}% → ${masterDecision}
    `);

    try {
      const res = await fetch('/api/trading-bot/signal', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          signal: masterDecision,
          timestamp,
          debug: true,
          stopLossPips: slPips,
          takeProfitPips: tpPips,
          positionSize: posSize_num,
          confidence: Math.round(confidence),
        })
      });

      if (!res.ok) {
        console.error('Failed to send signal:', await res.json());
      } else {
        const result = await res.json();
        console.log('✓ Signal sent to EA:', result);
      }
    } catch (error) {
      console.error('Failed to send signal:', error);
    }
  }, []);

  // Manual agent signal trigger for debug mode
  const triggerManualSignal = useCallback((agent: string) => {
    console.log(`[DEBUG] 🎯 Manual trigger for ${agent.toUpperCase()} agent`);
    // This would trigger the specific agent's analysis
    // For now, just log it - the agent state updates are driven by useEffects in AIReportsSection
    setLastSignal({
      signal: `Manual ${agent.toUpperCase()} trigger`,
      timestamp: new Date().toISOString(),
    });
  }, []);

  // Debug signal handler (Buy/Sell from Master Agent Card)
  const handleDebugSignal = useCallback(async (signal: 'BUY' | 'SELL') => {
    try {
      console.log(`[DEBUG] Master Agent debug signal: ${signal}`);
      const res = await fetch('/api/trading-bot/signal', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          signal,
          timestamp: new Date().toISOString(),
          debug: true,
          stopLossPips: 50,
          takeProfitPips: 100,
          positionSize: 0.01,
          confidence: 50,
        })
      });

      if (!res.ok) {
        console.error('Failed to send debug signal:', await res.json());
      } else {
        const result = await res.json();
        console.log(`✓ Debug signal sent: ${signal}`, result);
        setLastSignal({
          signal: `Debug ${signal}`,
          timestamp: new Date().toISOString(),
        });
      }
    } catch (error) {
      console.error('Failed to send debug signal:', error);
    }
  }, []);

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
    }
  }, []);

  useEffect(() => {
    setLoading(true);

    // Fetch news on mount and periodically
    fetchNews();
    const newsInterval = setInterval(fetchNews, 30000); // Fetch news every 30s

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

            // Mark as new only if never seen before in this session
            if (!seenPositionIds.current.has(pos.id)) {
              seenPositionIds.current.add(pos.id);
              setNewPositionIds(prev => {
                const updated = new Set(prev);
                updated.add(pos.id);
                return updated;
              });
              setTimeout(() => {
                setNewPositionIds(p => {
                  const next = new Set(p);
                  next.delete(pos.id);
                  return next;
                });
              }, 2000);
            }
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
      clearInterval(newsInterval);
    };
  }, [fetchTrades, fetchReportHistory, fetchNews]);

  // Real-time Trend Agent watcher.
  //
  // Single self-scheduling chain (recursive setTimeout, never setInterval) —
  // by construction there is only ever ONE read in flight at a time, so the
  // "new candle" comparison can never race with itself. Each cycle:
  //   1. reads ma_data (also refreshes the live MA display values)
  //   2. fires the Trend Agent exactly once if — and only if — ma_timestamp
  //      changed since the last cycle (i.e. the 1m candle actually closed)
  //   3. schedules the next read only once this one is fully done
  useEffect(() => {
    let cancelled = false;
    let timer: ReturnType<typeof setTimeout> | null = null;

    const readAndMaybeAct = async () => {
      try {
        const res = await fetch('/api/trading-bot/trend-signal');
        if (!res.ok) return;
        const trendData = await res.json();
        if (cancelled) return;

        // Always refresh live MA display values (price, MA9/21/50, ma_50_trend)
        setSimulatedAgents(prev => {
          const base: SimulatedAgentOutput = prev || {
            trend:   { direction: 'NEUTRAL', score: 0 },
            history: { rrTarget: '1:3', consistency: 0, score: 0 },
            risk:    { slDistance: 0, tpRatio: '1:3', positionSize: '0.02', score: 0 },
            news:    { sentiment: 'Neutral', volatility: 0, score: 0 },
          };
          return {
            ...base,
            trend: {
              ...base.trend,
              ma_9:        trendData.ma_9        || base.trend.ma_9,
              ma_21:       trendData.ma_21       || base.trend.ma_21,
              ma_50:       trendData.ma_50       || base.trend.ma_50,
              ma_50_trend: trendData.ma_50_trend || base.trend.ma_50_trend,
              // Timezone-safe age of the current candle: the API computes
              // "seconds since open" using only the broker's own clocks (so
              // broker/local timezone offsets cancel out), and we stamp the
              // local time we received it so the card can tick it up live.
              ...(typeof trendData.candle_age_seconds === 'number'
                ? { candle_age_seconds: trendData.candle_age_seconds, candle_age_measured_at: Date.now() }
                : {}),
            },
          };
        });

        // The ONLY trigger for acting: the candle's timestamp actually changed.
        const maTimestamp: string = trendData.ma_timestamp || '';
        const isNewCandle = !!maTimestamp && maTimestamp !== lastCandleTimestamp.current;
        if (!isNewCandle) return;

        lastCandleTimestamp.current = maTimestamp;
        console.log('[DASHBOARD] 🕯️ New candle:', maTimestamp,
          '| crossover:', trendData.crossover_detected,
          trendData.crossover_direction ? `(${trendData.crossover_direction})` : '');

        try {
          const agentRes = await fetch('/api/trading-bot/agents/trend', { method: 'POST' });
          if (cancelled) return;
          if (agentRes.ok) {
            const agentData = await agentRes.json();
            console.log('[TREND AGENT] ✓', agentData.direction,
              '| entry_allowed:', agentData.entry_allowed,
              '| MA50 trend:', agentData.ma_50_trend,
              '| confidence:', agentData.confidence + '%');

            setSimulatedAgents(prev => {
              const base: SimulatedAgentOutput = prev || {
                trend:   { direction: 'NEUTRAL', score: 0 },
                history: { rrTarget: '1:3', consistency: 0, score: 0 },
                risk:    { slDistance: 0, tpRatio: '1:3', positionSize: '0.02', score: 0 },
                news:    { sentiment: 'Neutral', volatility: 0, score: 0 },
              };
              return {
                ...base,
                trend: {
                  ...base.trend,
                  direction:        agentData.direction        || 'NEUTRAL',
                  score:            Math.max(0, (agentData.confidence || 0) / 4),
                  ma_9:             agentData.ma_9,
                  ma_21:            agentData.ma_21,
                  ma_50:            agentData.ma_50,
                  ma_50_trend:      agentData.ma_50_trend,
                  crossover_status: agentData.crossover_status,
                  entry_allowed:    agentData.entry_allowed,
                  reasoning:        agentData.reasoning,
                },
              };
            });
          } else if (agentRes.status !== 503) {
            // 503 = transient (mid-write or EA not started) — ignore silently
            console.error('[TREND AGENT] ✗ HTTP', agentRes.status);
          }
        } catch (agentErr) {
          console.error('[TREND AGENT] ✗ Call failed:', agentErr);
        }
      } catch (_error) {
        // Silently fail
      } finally {
        // Only schedule the next read once this one is fully resolved —
        // guarantees a single, sequential, never-overlapping chain.
        if (!cancelled) timer = setTimeout(readAndMaybeAct, 1000);
      }
    };

    readAndMaybeAct();
    return () => {
      cancelled = true;
      if (timer) clearTimeout(timer);
    };
  }, []);

  const refreshData = async () => {
    setLoading(true);
    await fetchTrades();
  };

  // Debug mode: Generate random signals on each candle (history change)
  useEffect(() => {
    if (debugMode && history.length > 0) {
      generateDebugSignal();
    }
  }, [debugMode, history.length, generateDebugSignal]);

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
      pnlData: pnl.reverse(),
      equityData: equity.reverse(),
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

  // Generate agent reports (after reports is computed)
  useEffect(() => {
    if (!stats.totalTrades || stats.totalTrades === 0) return;

    // Trend Agent report
    const trend = reports.longestWinStreak > 3 ? 'UPTREND' : reports.longestLoseStreak > 3 ? 'DOWNTREND' : 'NEUTRAL';
    addReport(
      'trend',
      `📈 Trend Detection: ${trend}`,
      {
        winStreak: reports.longestWinStreak,
        lossStreak: reports.longestLoseStreak,
        ma200Angle: reports.longestWinStreak > 3 ? 0.0045 : reports.longestLoseStreak > 3 ? -0.0035 : 0.0008,
      },
      trend
    );

    // Risk Agent report
    const riskStatus = reports.maxDrawdown > stats.totalPnl * 0.5 ? '⚠️ HIGH' : '✓ WITHIN LIMITS';
    const rrRatio = reports.longestWinStreak > 3 ? '1:6-9' : reports.longestLoseStreak > 3 ? '1:3-6' : '1:1.5';
    addReport(
      'risk',
      `🛡️ Risk Assessment: ${riskStatus}`,
      {
        maxDrawdown: `${reports.maxDrawdown.toFixed(2)}%`,
        rrRatio,
        positionSize: reports.longestWinStreak > 3 ? '0.02-0.05' : '0.01',
      },
      riskStatus
    );

    // History Agent report
    const consistency = stats.totalTrades > 100 ? 87 : stats.totalTrades > 50 ? 72 : 0;
    const edgeQuality = stats.totalTrades > 100 && reports.longestWinStreak > 3 ? '✓ STRONG' : '⚠ MONITOR';
    addReport(
      'history',
      `📊 Performance Analysis: ${edgeQuality}`,
      {
        totalTrades: stats.totalTrades,
        winRate: `${stats.winRate}%`,
        consistency: `${consistency}%`,
        expectancy: reports.expectancy.toFixed(4),
      },
      edgeQuality
    );
  }, [reports.longestWinStreak, reports.longestLoseStreak, reports.maxDrawdown, reports.expectancy, stats.totalTrades, stats.totalPnl, stats.winRate, addReport]);

  return (
    <div className="h-screen overflow-hidden bg-[#06080f] text-white selection:bg-cyan-500/30 flex flex-col">
      {/* Ambient background glow */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-96 h-96 bg-cyan-500/[0.17] rounded-full blur-[120px]" />
        <div className="absolute top-1/3 -left-40 w-96 h-96 bg-violet-500/[0.1] rounded-full blur-[120px]" />
        <div className="absolute -bottom-40 right-1/3 w-96 h-96 bg-emerald-500/[0.15] rounded-full blur-[120px]" />
      </div>

      <div className="relative flex flex-col flex-1 min-h-0 w-full px-4 sm:px-6 lg:px-8 py-3">
        {/* Header */}
        <Header
          version={version}
          stats={stats}
          loading={loading}
          onRefresh={refreshData}
          debugMode={debugMode}
          onDebugToggle={setDebugMode}
          onReportsClick={() => setReportsModalOpen(true)}
        />

        {/* Charts Row: Equity (large) + P&L sparkline (small) */}
        <div className="grid grid-cols-4 gap-2 mb-3 shrink-0" style={{ height: '20%' }}>
          {/* Equity Curve — 2 cols */}
          <div className="col-span-3">
            <EquityChart data={equityData} />
          </div>

          {/* P&L Per Trade — 1 col, compact */}
          <PnLChart data={pnlData} />
        </div>

        {/* Main Content: Metrics | AI & Reports | History */}
        <div className="grid grid-cols-6 gap-2 flex-1 min-h-0">
          {/* AI & Reports */}
          <AIReportsSection
            aiAnalysis={aiAnalysis}
            openPositions={openPositions}
            floatingPnL={floatingPnL}
            newPositionIds={newPositionIds}
            stats={stats}
            reports={reports}
            history={history}
            report={report}
            reportLoading={reportLoading}
            reportHistory={reportHistory}
            generateReport={generateReport}
            fetchReportHistory={fetchReportHistory}
            onCloseReport={() => setReport(null)}
            lastSignal={lastSignal}
            simulatedAgents={simulatedAgents}
            latestNews={latestNews}
            fetchNews={fetchNews}
            debugMode={debugMode}
            onDebugSignal={handleDebugSignal}
          />

          {/* Metrics & History Combined — 70/30 split */}
          <div className="col-span-1 flex flex-col gap-2 min-h-0">
            {/* Metrics 70% */}
            <div className="flex-[7] min-h-0 overflow-hidden">
              <MetricsSection reports={reports} totalCommission={totalCommission} history={history} />
            </div>

            {/* History 30% */}
            <div className="flex-[3] min-h-0 overflow-hidden">
              <TradeHistorySection history={history} />
            </div>
          </div>
        </div>

        {/* Footer */}
        <footer className="mt-2 flex items-center justify-center shrink-0">
          <span className="text-[11px] text-white/10">MikaBot v0.1</span>
        </footer>
      </div>

      {/* Agent Reports Modal */}
      <AgentReportsModal
        isOpen={reportsModalOpen}
        onClose={() => setReportsModalOpen(false)}
      />

      {/* Debug Panel */}
      <DebugPanel
        debugMode={debugMode}
        onDebugToggle={setDebugMode}
        onManualSignal={triggerManualSignal}
        agentLastRun={{}}
        activeAgent={null}
        stats={stats}
      />
    </div>
  );
}
