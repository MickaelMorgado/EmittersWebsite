"use client";

import { Download, Copy, Check, X } from 'lucide-react';
import { useState, useMemo } from 'react';

interface XmTrade {
  id: string;
  type: string;
  price: number;
  volume: number;
  time: string;
  result?: 'WIN' | 'LOSS';
  netProfit: number;
}

interface ExportPopupProps {
  history: XmTrade[];
  stats: {
    totalTrades: number;
    winRate: number;
    totalPnl: number;
    bestTrade: number;
    worstTrade: number;
    avgWin: number;
    avgLoss: number;
    profitFactor: number;
    expectancy: number;
    currentStreak: number;
    currentStreakType: 'WIN' | 'LOSS' | null;
  };
  dateStart: string;
  dateEnd: string;
}

export default function ExportPopup({ history, stats, dateStart, dateEnd }: ExportPopupProps) {
  const [open, setOpen] = useState(false);
  const [copied, setCopied] = useState(false);

  const text = useMemo(() => {
    const lines: string[] = [];
    lines.push(`XM Trading Report`);
    lines.push(`Period: ${dateStart} → ${dateEnd}`);
    lines.push(`Generated: ${new Date().toISOString().split('T')[0]}`);
    lines.push('');
    lines.push('--- SUMMARY ---');
    lines.push(`Total Trades: ${stats.totalTrades}`);
    lines.push(`Win Rate: ${stats.winRate.toFixed(1)}%`);
    lines.push(`Total P/L: €${stats.totalPnl.toFixed(2)}`);
    lines.push(`Best Trade: €${stats.bestTrade.toFixed(2)}`);
    lines.push(`Worst Trade: €${stats.worstTrade.toFixed(2)}`);
    lines.push(`Avg Win: €${stats.avgWin.toFixed(2)}`);
    lines.push(`Avg Loss: €${stats.avgLoss.toFixed(2)}`);
    lines.push(`Profit Factor: ${stats.profitFactor.toFixed(2)}`);
    lines.push(`Expectancy: €${stats.expectancy.toFixed(2)}`);
    lines.push(`Streak: ${stats.currentStreak > 0 ? stats.currentStreak : ''}${stats.currentStreakType || '-'}`);
    lines.push('');

    // Group by day
    const byDay: Record<string, XmTrade[]> = {};
    history.forEach((t) => {
      const day = t.time.split(' ')[0].replace(/\./g, '-');
      if (!byDay[day]) byDay[day] = [];
      byDay[day].push(t);
    });

    lines.push('--- TRADES BY DAY ---');
    Object.keys(byDay).sort().forEach((day) => {
      const dayTrades = byDay[day];
      const dayPnl = dayTrades.reduce((a, t) => a + t.netProfit, 0);
      lines.push('');
      lines.push(`${day} (${dayTrades.length} trades, P/L: €${dayPnl.toFixed(2)})`);
      dayTrades.forEach((t) => {
        const time = t.time.split(' ')[1] || '';
        const sign = t.netProfit >= 0 ? '+' : '';
        lines.push(`  ${time} ${t.type} ${t.volume} @ ${t.price} → ${sign}€${t.netProfit.toFixed(2)}`);
      });
    });

    return lines.join('\n');
  }, [history, stats, dateStart, dateEnd]);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="p-1.5 hover:bg-white/[0.08] rounded transition-colors cursor-pointer"
        title="Export"
      >
        <Download className="w-3.5 h-3.5 text-white/40" />
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm" onClick={() => setOpen(false)}>
          <div
            className="bg-[#0a0a0f] border border-white/[0.08] rounded-lg w-[500px] max-h-[80vh] flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between px-4 py-3 border-b border-white/[0.05]">
              <span className="text-xs font-semibold text-white/50">Export Report</span>
              <div className="flex items-center gap-2">
                <button
                  onClick={handleCopy}
                  className="flex items-center gap-1.5 px-2.5 py-1 bg-violet-500/15 hover:bg-violet-500/25 rounded text-[11px] font-medium text-violet-400 transition-colors cursor-pointer"
                >
                  {copied ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                  {copied ? 'Copied!' : 'Copy'}
                </button>
                <button onClick={() => setOpen(false)} className="p-1 hover:bg-white/[0.08] rounded transition-colors cursor-pointer">
                  <X className="w-3.5 h-3.5 text-white/40" />
                </button>
              </div>
            </div>
            <div className="flex-1 min-h-0 overflow-auto p-4">
              <pre className="text-[11px] font-mono text-white/50 whitespace-pre-wrap leading-relaxed">{text}</pre>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
