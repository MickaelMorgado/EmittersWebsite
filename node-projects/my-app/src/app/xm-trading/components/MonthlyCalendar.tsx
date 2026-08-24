"use client";

import { ChevronLeft, ChevronRight, Calendar, AlertTriangle } from 'lucide-react';
import { useMemo, useState } from 'react';

interface XmTrade {
  id: string;
  type: string;
  price: number;
  volume: number;
  time: string;
  result?: 'WIN' | 'LOSS';
  netProfit: number;
}

interface MonthlyCalendarProps {
  history: XmTrade[];
  initialCapital?: number;
}

function parseDate(time: string): Date {
  return new Date(time.replace(/\./g, '-').replace(' ', 'T'));
}

function formatMonth(year: number, month: number): string {
  return new Date(year, month).toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
}

export default function MonthlyCalendar({ history, initialCapital = 50 }: MonthlyCalendarProps) {
  const now = new Date();
  const [year, setYear] = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth());
  const [thresholdPct, setThresholdPct] = useState(1);

  const { dailyPnl, dailyCount, weeklyPnls, monthlyPnl, weeks } = useMemo(() => {
    const pnlByDay: Record<number, number> = {};
    const countByDay: Record<number, number> = {};
    history.forEach((t) => {
      const d = parseDate(t.time);
      if (d.getFullYear() === year && d.getMonth() === month) {
        const day = d.getDate();
        pnlByDay[day] = (pnlByDay[day] || 0) + t.netProfit;
        countByDay[day] = (countByDay[day] || 0) + 1;
      }
    });

    const mPnl = Object.values(pnlByDay).reduce((a, b) => a + b, 0);

    // Build weeks for the month
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const startDow = firstDay.getDay(); // 0=Sun
    const totalDays = lastDay.getDate();

    const weeksData: (number | null)[][] = [];
    let currentWeek: (number | null)[] = new Array(startDow).fill(null);

    for (let dayNum = 1; dayNum <= totalDays; dayNum++) {
      currentWeek.push(dayNum);
      if (currentWeek.length === 7) {
        weeksData.push(currentWeek);
        currentWeek = [];
      }
    }
    if (currentWeek.length > 0) {
      while (currentWeek.length < 7) currentWeek.push(null);
      weeksData.push(currentWeek);
    }

    // Weekly P/L
    const wPnls = weeksData.map((week) =>
      week.reduce((sum, day) => (day !== null ? sum + (pnlByDay[day] || 0) : sum), 0)
    );

    return { dailyPnl: pnlByDay, dailyCount: countByDay, weeklyPnls: wPnls, monthlyPnl: mPnl, weeks: weeksData };
  }, [history, year, month]);

  const prevMonth = () => {
    if (month === 0) { setMonth(11); setYear(year - 1); }
    else setMonth(month - 1);
  };

  const nextMonth = () => {
    if (month === 11) { setMonth(0); setYear(year + 1); }
    else setMonth(month + 1);
  };

  const goToCurrent = () => {
    setYear(now.getFullYear());
    setMonth(now.getMonth());
  };

  const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const thresholdAmount = initialCapital * (thresholdPct / 100);

  return (
    <div className="bg-white/[0.02] border border-white/[0.05] flex flex-col min-h-0 rounded h-full">
      <div className="flex items-center justify-between px-3 py-2.5 border-b border-white/[0.05] shrink-0">
        <div className="flex items-center gap-1.5">
          <Calendar className="w-4 h-4 text-violet-400/40" />
          <h2 className="text-[11px] font-semibold text-white/50 tracking-wide">Calendar</h2>
        </div>
        <div className="flex items-center gap-1">
          <div className="flex items-center gap-1 mr-1">
            <AlertTriangle className="w-2.5 h-2.5 text-orange-400/50" />
            <input
              type="number"
              min="0"
              max="100"
              step="0.1"
              value={thresholdPct}
              onChange={(e) => setThresholdPct(Number(e.target.value))}
              className="w-10 bg-white/[0.04] border border-white/[0.06] rounded px-1 py-0.5 text-[9px] font-mono text-orange-400/70 text-center outline-none [color-scheme:dark]"
            />
            <span className="text-[9px] text-white/20">%</span>
          </div>
          <button onClick={prevMonth} className="p-1 hover:bg-white/[0.08] rounded transition-colors cursor-pointer">
            <ChevronLeft className="w-3.5 h-3.5 text-white/40" />
          </button>
          <button onClick={goToCurrent} className="text-[11px] font-mono text-white/50 hover:text-white/80 px-2 py-0.5 hover:bg-white/[0.06] rounded transition-colors cursor-pointer">
            {formatMonth(year, month)}
          </button>
          <button onClick={nextMonth} className="p-1 hover:bg-white/[0.08] rounded transition-colors cursor-pointer">
            <ChevronRight className="w-3.5 h-3.5 text-white/40" />
          </button>
        </div>
      </div>

      <div className="flex-1 min-h-0 overflow-y-auto px-2 py-1.5">
        {/* Day headers */}
        <div className="grid grid-cols-7 gap-1 mb-2">
          {dayNames.map((d) => (
            <div key={d} className="text-center text-[11px] text-white/25 uppercase font-bold">{d}</div>
          ))}
        </div>

        {/* Calendar grid */}
        <div className="space-y-1">
          {weeks.map((week, wi) => {
            const weekPnl = weeklyPnls[wi];
            return (
              <div key={wi}>
                <div className="grid grid-cols-7 gap-1">
                  {week.map((day, di) => {
                    if (day === null) return <div key={di} />;
                    const pnl = dailyPnl[day] || 0;
                    const count = dailyCount[day] || 0;
                    const isToday = day === now.getDate() && month === now.getMonth() && year === now.getFullYear();
                    const bg = pnl > 0 ? 'bg-emerald-500/15' : pnl < 0 ? 'bg-red-500/15' : 'bg-white/[0.02]';
                    const textColor = pnl > 0 ? 'text-emerald-400' : pnl < 0 ? 'text-red-400' : 'text-white/30';
                    const pnlPct = initialCapital > 0 ? (pnl / initialCapital) * 100 : 0;
                    const showWarning = count > 0 && pnl < -thresholdAmount;
                    return (
                      <div
                        key={di}
                        className={`relative flex flex-col items-center justify-center h-[48px] rounded ${bg} ${isToday ? 'ring-1 ring-violet-500/40' : ''}`}
                      >
                        {showWarning && (
                          <AlertTriangle className="absolute top-0.5 right-0.5 w-2.5 h-2.5 text-orange-400/70" />
                        )}
                        <span className={`text-[12px] font-bold leading-tight ${isToday ? 'text-violet-400' : 'text-white/40'}`}>{day}</span>
                        {count > 0 ? (
                          <div className="flex flex-col items-center leading-tight">
                            <span className="text-[8px] font-mono text-white/20">{count}×{pnl >= 0 ? '+' : ''}{pnl.toFixed(2)}</span>
                            {pnl !== 0 && (
                              <span className={`text-[8px] font-mono ${pnlPct >= 0 ? 'text-emerald-400/40' : 'text-red-400/40'}`}>
                                {pnlPct >= 0 ? '+' : ''}{pnlPct.toFixed(1)}%
                              </span>
                            )}
                          </div>
                        ) : <span />}
                      </div>
                    );
                  })}
                </div>
                {/* Weekly summary row */}
                <div className="flex items-center justify-end px-1 py-1">
                  <span className="text-[10px] text-white/20 mr-1">week</span>
                  <span className={`text-[10px] font-mono font-bold ${weekPnl >= 0 ? 'text-emerald-400/70' : 'text-red-400/70'}`}>
                    {weekPnl >= 0 ? '+' : ''}{weekPnl.toFixed(2)}
                  </span>
                </div>
              </div>
            );
          })}
        </div>

        {/* Monthly total */}
        <div className="flex items-center justify-between mt-2 px-1 py-2 border-t border-white/[0.05]">
          <span className="text-[11px] text-white/30 uppercase tracking-wider font-bold">Monthly P/L</span>
          <span className={`text-[13px] font-mono font-bold ${monthlyPnl >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
            {monthlyPnl >= 0 ? '+' : ''}{monthlyPnl.toFixed(2)}
          </span>
        </div>
      </div>
    </div>
  );
}
