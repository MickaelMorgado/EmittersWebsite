"use client";

import { Calendar } from 'lucide-react';

interface DateRangePickerProps {
  start: string;
  end: string;
  onStartChange: (v: string) => void;
  onEndChange: (v: string) => void;
}

export default function DateRangePicker({ start, end, onStartChange, onEndChange }: DateRangePickerProps) {
  return (
    <div className="flex items-center gap-1.5 px-2 py-1 bg-white/[0.02] border border-white/[0.05] rounded">
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
  );
}
