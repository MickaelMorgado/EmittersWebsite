"use client";

import { useCallback, useRef } from 'react';

interface RangeZoomSliderProps {
  /** Total number of data points (slider spans [0, max-1]) */
  max: number;
  startIndex: number;
  endIndex: number;
  onChange: (start: number, end: number) => void;
  /** Accent color for the selected window + handles, e.g. 'rgba(34,211,238,0.8)' */
  color: string;
}

/**
 * Full-height "windowing" brush that overlays the chart's plot area directly —
 * styled like the selection brush in TradingView/D3 charts rather than a
 * separate slider control. The area outside the selected range is dimmed,
 * the selected window is left clear (so the chart reads through it), and
 * thin glowing edge-rails along its sides act as resize handles. Dragging
 * inside the window pans the whole range.
 */
export default function RangeZoomSlider({ max, startIndex, endIndex, onChange, color }: RangeZoomSliderProps) {
  const trackRef = useRef<HTMLDivElement>(null);
  const upperBound = Math.max(max - 1, 0);
  const railColor = color.replace(/[\d.]+\)$/, '0.55)');
  const glowColor = color.replace(/[\d.]+\)$/, '0.16)');
  const washColor = color.replace(/[\d.]+\)$/, '0.025)');
  const dimColor = 'rgba(5,8,14,0.28)';

  const pctToIndex = useCallback((clientX: number): number => {
    const track = trackRef.current;
    if (!track) return 0;
    const rect = track.getBoundingClientRect();
    const pct = Math.min(1, Math.max(0, (clientX - rect.left) / rect.width));
    return Math.round(pct * upperBound);
  }, [upperBound]);

  const startDrag = (mode: 'start' | 'end' | 'pan') => (e: React.PointerEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const target = e.currentTarget as HTMLElement;
    target.setPointerCapture(e.pointerId);

    const initialIndex = pctToIndex(e.clientX);
    const rangeWidth = endIndex - startIndex;
    const panOriginStart = startIndex;
    const panOriginIndex = initialIndex;

    const handleMove = (ev: PointerEvent) => {
      const idx = pctToIndex(ev.clientX);
      if (mode === 'start') {
        onChange(Math.min(idx, endIndex - 1), endIndex);
      } else if (mode === 'end') {
        onChange(startIndex, Math.max(idx, startIndex + 1));
      } else {
        const delta = idx - panOriginIndex;
        let newStart = panOriginStart + delta;
        newStart = Math.max(0, Math.min(upperBound - rangeWidth, newStart));
        onChange(newStart, newStart + rangeWidth);
      }
    };
    const handleUp = () => {
      window.removeEventListener('pointermove', handleMove);
      window.removeEventListener('pointerup', handleUp);
    };
    window.addEventListener('pointermove', handleMove);
    window.addEventListener('pointerup', handleUp);
  };

  const startPct = (startIndex / Math.max(upperBound, 1)) * 100;
  const endPct = (endIndex / Math.max(upperBound, 1)) * 100;

  return (
    <div ref={trackRef} className="absolute inset-0 select-none pointer-events-none">
      {/* Dim the regions outside the selected window — reads as "this part of
          the chart is currently hidden", like a film-strip selection mask */}
      <div className="absolute inset-y-0 left-0 pointer-events-none" style={{ width: `${startPct}%`, background: dimColor }} />
      <div className="absolute inset-y-0 right-0 pointer-events-none" style={{ width: `${100 - endPct}%`, background: dimColor }} />

      {/* Selected window — left clear with a faint accent wash + glowing
          top/bottom borders so it visually belongs to the chart, not floats
          above it. Drag anywhere inside to pan. */}
      <div
        onPointerDown={startDrag('pan')}
        className="absolute inset-y-0 cursor-grab active:cursor-grabbing pointer-events-auto group"
        style={{
          left: `${startPct}%`,
          right: `${100 - endPct}%`,
          background: washColor,
          borderTop: `1px solid ${glowColor}`,
          borderBottom: `1px solid ${glowColor}`,
          boxShadow: `inset 0 0 8px ${glowColor}`,
        }}
      >
        {/* Left edge-rail / resize handle */}
        <div
          onPointerDown={startDrag('start')}
          className="absolute -left-[3px] top-0 bottom-0 w-[6px] cursor-ew-resize flex items-center justify-center"
        >
          <div
            className="w-[1.5px] h-full rounded-full transition-[width,box-shadow,opacity] opacity-60 group-hover:opacity-100 group-hover:w-[2px]"
            style={{ background: railColor, boxShadow: `0 0 4px ${glowColor}` }}
          />
        </div>
        {/* Right edge-rail / resize handle */}
        <div
          onPointerDown={startDrag('end')}
          className="absolute -right-[3px] top-0 bottom-0 w-[6px] cursor-ew-resize flex items-center justify-center"
        >
          <div
            className="w-[1.5px] h-full rounded-full transition-[width,box-shadow,opacity] opacity-60 group-hover:opacity-100 group-hover:w-[2px]"
            style={{ background: railColor, boxShadow: `0 0 4px ${glowColor}` }}
          />
        </div>
        {/* Centered grip glyph — subtle affordance that this band is draggable */}
        <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-25 transition-opacity">
          <div className="flex gap-[3px]">
            <span className="w-[1.5px] h-2.5 rounded-full" style={{ background: railColor }} />
            <span className="w-[1.5px] h-2.5 rounded-full" style={{ background: railColor }} />
          </div>
        </div>
      </div>
    </div>
  );
}
