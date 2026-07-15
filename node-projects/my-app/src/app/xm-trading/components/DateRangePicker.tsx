"use client";

import { Calendar } from 'lucide-react';

interface DateRangePickerProps {
  start: string;
  end: string;
  onStartChange: (v: string) => void;
  onEndChange: (v: string) => void;
  firstTradeDate?: string;
}

function toISO(d: Date) {
  return d.toISOString().split('T')[0];
}

export default function DateRangePicker({ start, end, onStartChange, onEndChange, firstTradeDate }: DateRangePickerProps) {
  const now = new Date();

  const setWeek = () => {
    const day = now.getDay();
    const monday = new Date(now);
    monday.setDate(now.getDate() - ((day + 6) % 7));
    onStartChange(toISO(monday));
    onEndChange(toISO(now));
  };

  const setMonth = () => {
    const first = new Date(now.getFullYear(), now.getMonth(), 1);
    onStartChange(toISO(first));
    onEndChange(toISO(now));
  };

  const setAll = () => {
    if (firstTradeDate) {
      onStartChange(firstTradeDate);
      onEndChange(toISO(now));
    }
  };

  const isWeekActive = (() => {
    const day = now.getDay();
    const monday = new Date(now);
    monday.setDate(now.getDate() - ((day + 6) % 7));
    return start === toISO(monday) && end === toISO(now);
  })();

  const isMonthActive = (() => {
    const first = new Date(now.getFullYear(), now.getMonth(), 1);
    return start === toISO(first) && end === toISO(now);
  })();

  const setToday = () => {
    onStartChange(toISO(now));
    onEndChange(toISO(now));
  };

  const isTodayActive = start === toISO(now) && end === toISO(now);

  return (
    <div className="flex items-center gap-1.5">
      <div className="flex items-center gap-1 px-2 py-1 bg-white/[0.02] border border-white/[0.05] rounded">
        <Calendar className="w-3 h-3 text-violet-400/50" />
        <input
          type="date"
          value={start}
          onChange={(e) => onStartChange(e.target.value)}
          className="bg-transparent text-[11px] font-mono text-white/60 border-none outline-none [color-scheme:dark] cursor-pointer"
        />
        <span className="text-[10px] text-white/25">→</span>
        <input
          type="date"
          value={end}
          onChange={(e) => onEndChange(e.target.value)}
          className="bg-transparent text-[11px] font-mono text-white/60 border-none outline-none [color-scheme:dark] cursor-pointer"
        />
      </div>
      <div className="flex items-center gap-0.5 px-1 py-1 bg-white/[0.02] border border-white/[0.05] rounded">
        <button
          onClick={setToday}
          className={`px-2 py-0.5 text-[10px] font-medium rounded transition-colors cursor-pointer ${isTodayActive ? 'bg-violet-500/20 text-violet-400' : 'text-white/30 hover:text-white/50 hover:bg-white/[0.05]'}`}
        >
          Today
        </button>
        <button
          onClick={setWeek}
          className={`px-2 py-0.5 text-[10px] font-medium rounded transition-colors cursor-pointer ${isWeekActive ? 'bg-violet-500/20 text-violet-400' : 'text-white/30 hover:text-white/50 hover:bg-white/[0.05]'}`}
        >
          Week
        </button>
        <button
          onClick={setMonth}
          className={`px-2 py-0.5 text-[10px] font-medium rounded transition-colors cursor-pointer ${isMonthActive ? 'bg-violet-500/20 text-violet-400' : 'text-white/30 hover:text-white/50 hover:bg-white/[0.05]'}`}
        >
          Month
        </button>
      </div>
    </div>
  );
}
