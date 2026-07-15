"use client";

import { useCallback, useEffect, useMemo, useState } from 'react';
import DateRangePicker from './components/DateRangePicker';
import EquityChart from './components/EquityChart';
import Header from './components/Header';
import MetricsSection from './components/MetricsSection';
import RiskLimitsCard from './components/RiskLimitsCard';
import TradeHistorySection from './components/TradeHistorySection';

interface XmTrade {
  id: string;
  type: string;
  price: number;
  volume: number;
  time: string;
  result?: 'WIN' | 'LOSS';
  pnl?: number;
  commission?: number;
  swap?: number;
  netProfit?: number;
}

function parseTradeDate(time: string): Date {
  const cleaned = time.replace(/\./g, '-').replace(' ', 'T');
  return new Date(cleaned);
}

function toDateString(d: Date): string {
  return d.toISOString().split('T')[0];
}

export default function XmTradingDashboard() {
  const [allHistory, setAllHistory] = useState<XmTrade[]>([]);
  const [account, setAccount] = useState<number | null>(null);
  const [symbol, setSymbol] = useState<string | null>(null);
  const [version, setVersion] = useState('1.00');
  const [loading, setLoading] = useState(true);

  const [dateStart, setDateStart] = useState('');
  const [dateEnd, setDateEnd] = useState(toDateString(new Date()));

  const fetchTrades = useCallback(async () => {
    try {
      const res = await fetch('/api/xm-trading');
      const data = await res.json();
      setAllHistory(data.history || []);
      if (data.account) setAccount(data.account);
      if (data.symbol) setSymbol(data.symbol);
      if (data.version) setVersion(data.version);
    } catch (error) {
      console.error('Failed to fetch XM trades:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    setLoading(true);
    fetchTrades();
    const interval = setInterval(fetchTrades, 10000);
    return () => clearInterval(interval);
  }, [fetchTrades]);

  // Set default start date from first trade once data loads
  useEffect(() => {
    if (allHistory.length > 0 && !dateStart) {
      const chronological = [...allHistory].reverse();
      const firstDate = parseTradeDate(chronological[0].time);
      setDateStart(toDateString(firstDate));
    }
  }, [allHistory, dateStart]);

  // Filter history by date range
  const history = useMemo(() => {
    if (!dateStart) return allHistory;
    const start = new Date(dateStart + 'T00:00:00');
    const end = new Date(dateEnd + 'T23:59:59');
    return allHistory.filter((t) => {
      const d = parseTradeDate(t.time);
      return d >= start && d <= end;
    });
  }, [allHistory, dateStart, dateEnd]);

  const stats = useMemo(() => {
    const wins = history.filter((t) => t.netProfit >= 0).length;
    const losses = history.filter((t) => t.netProfit < 0).length;
    const total = history.length;
    const winRate = total > 0 ? Math.round((wins / total) * 1000) / 10 : 0;
    const totalPnl = history.reduce((sum, t) => sum + t.netProfit, 0);
    return { totalTrades: total, wins, losses, winRate, totalPnl: Math.round(totalPnl * 100) / 100 };
  }, [history]);

  const { equityData, reports } = useMemo(() => {
    const chronological = [...history].reverse();
    let cumulative = 0;
    let peak = 0;
    let maxDrawdown = 0;
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
      cumulative += t.netProfit;

      if (t.netProfit > bestTrade) bestTrade = t.netProfit;
      if (t.netProfit < worstTrade) worstTrade = t.netProfit;

      if (t.netProfit >= 0) {
        wins.push(t.netProfit);
        curWinStreak++;
        curLoseStreak = 0;
      } else {
        losses.push(Math.abs(t.netProfit));
        curLoseStreak++;
        curWinStreak = 0;
      }
      if (curWinStreak > longestWinStreak) longestWinStreak = curWinStreak;
      if (curLoseStreak > longestLoseStreak) longestLoseStreak = curLoseStreak;

      if (cumulative > peak) peak = cumulative;
      const drawdown = peak - cumulative;
      if (drawdown > maxDrawdown) maxDrawdown = drawdown;

      equity.push({ trade: tradeLabel, equity: Math.round(cumulative * 100) / 100 });
    });

    const totalWins = wins.reduce((a, b) => a + b, 0);
    const totalLosses = losses.reduce((a, b) => a + b, 0);
    const profitFactor = totalLosses > 0 ? totalWins / totalLosses : totalWins > 0 ? Infinity : 0;
    const avgWin = wins.length > 0 ? totalWins / wins.length : 0;
    const avgLoss = losses.length > 0 ? totalLosses / losses.length : 0;
    const avgTrade = chronological.length > 0 ? cumulative / chronological.length : 0;
    const expectancy = chronological.length > 0
      ? (wins.length / chronological.length) * avgWin - (losses.length / chronological.length) * avgLoss
      : 0;

    return {
      equityData: equity.reverse(),
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
    <div className="h-screen overflow-hidden bg-[#06080f] text-white selection:bg-violet-500/30 flex flex-col">
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-96 h-96 bg-violet-500/[0.12] rounded-full blur-[120px]" />
        <div className="absolute top-1/3 -left-40 w-96 h-96 bg-blue-500/[0.08] rounded-full blur-[120px]" />
        <div className="absolute -bottom-40 right-1/3 w-96 h-96 bg-emerald-500/[0.1] rounded-full blur-[120px]" />
      </div>

      <div className="relative flex flex-col flex-1 min-h-0 w-full px-4 sm:px-6 lg:px-8 py-3">
        <div className="flex items-center justify-between mb-3 shrink-0">
          <Header
            version={version}
            stats={stats}
            account={account}
            symbol={symbol}
            loading={loading}
            onRefresh={fetchTrades}
          />
          <DateRangePicker
            start={dateStart}
            end={dateEnd}
            onStartChange={setDateStart}
            onEndChange={setDateEnd}
          />
        </div>

        <div className="grid grid-cols-4 gap-2 mb-3 shrink-0" style={{ height: '20%' }}>
          <div className="col-span-3">
            <EquityChart data={equityData} />
          </div>
          <RiskLimitsCard stats={stats} />
        </div>

        <div className="grid grid-cols-2 gap-2 flex-1 min-h-0">
          <MetricsSection reports={reports} stats={stats} />
          <TradeHistorySection history={history} />
        </div>

        <footer className="mt-2 flex items-center justify-center shrink-0">
          <span className="text-[11px] text-white/10">XM Trading — {symbol} — Account #{account}</span>
        </footer>
      </div>
    </div>
  );
}
