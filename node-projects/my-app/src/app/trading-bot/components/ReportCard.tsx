"use client";

import { AlertTriangle, BarChart3, Brain, Check, Copy, RefreshCw, Sparkles, Target, TrendingUp, Zap } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { useState } from 'react';

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
  onGenerateReport?: () => void;
}

function timeAgo(iso: string) {
  const s = Math.floor((Date.now() - new Date(iso).getTime()) / 1000);
  if (s < 60)   return `${s}s ago`;
  if (s < 3600) return `${Math.floor(s / 60)}m ago`;
  if (s < 86400) return `${Math.floor(s / 3600)}h ago`;
  return `${Math.floor(s / 86400)}d ago`;
}

function pickInsightIcon(content: string): LucideIcon {
  const c = content.toLowerCase();
  if (/position|lot|siz|volume/.test(c))          return Target;
  if (/risk|loss|stop|drawdown|hedge|protect/.test(c)) return AlertTriangle;
  if (/win|profit|gain|return|pnl|yield/.test(c)) return TrendingUp;
  if (/enter|exit|signal|trigger|breakout/.test(c)) return Zap;
  if (/strategy|trend|pattern|momentum|cycle/.test(c)) return BarChart3;
  return Brain;
}

function PostIt({
  item, accent, index, total,
}: { item: NoteItem; accent: 'cyan' | 'amber'; index?: number; total?: number }) {
  const deprecated = item.status === 'deprecated';
  const [copied, setCopied] = useState(false);
  const Icon = pickInsightIcon(item.content);
  const c = {
    cyan:  { border: 'border-cyan-500/20',  hover: 'hover:border-cyan-400/40',  bg: 'bg-cyan-500/[0.04]',  dot: 'bg-cyan-400',  icon: 'text-cyan-400/70',  ts: 'text-cyan-400/50',  num: 'text-cyan-400/30' },
    amber: { border: 'border-amber-500/20', hover: 'hover:border-amber-400/40', bg: 'bg-amber-500/[0.04]', dot: 'bg-amber-400', icon: 'text-amber-400/70', ts: 'text-amber-400/50', num: 'text-amber-400/30' },
  }[accent];

  function copy() {
    navigator.clipboard.writeText(item.content).catch(() => {});
    setCopied(true);
    setTimeout(() => setCopied(false), 1200);
  }

  return (
    <div className={`group relative rounded border ${c.border} ${c.bg} ${c.hover} p-2 pl-2.5 pr-7 transition-colors ${deprecated ? 'opacity-35' : ''}`}>
      <div className="flex items-center justify-between mb-1">
        <div className="flex items-center gap-1.5">
          <span className={`w-1.5 h-1.5 rounded-full ${c.dot} opacity-70`} />
          <Icon className={`w-2.5 h-2.5 ${c.icon}`} />
          {index !== undefined && total !== undefined && total > 1 && (
            <span className={`text-[9px] font-mono ${c.num}`}>{index + 1}/{total}</span>
          )}
        </div>
        <button
          onClick={copy}
          className="absolute top-1.5 right-1.5 opacity-0 group-hover:opacity-100 transition-opacity text-white/25 hover:text-white/70"
          title="Copy insight"
        >
          {copied
            ? <Check className="w-2.5 h-2.5 text-emerald-400" />
            : <Copy className="w-2.5 h-2.5" />}
        </button>
      </div>
      <p className={`text-[11px] leading-snug ${deprecated ? 'line-through text-white/30' : 'text-white/75'}`}>
        {item.content}
      </p>
      <div className="flex items-center mt-1.5">
        {deprecated
          ? <span className="text-[9px] text-white/25 uppercase tracking-wide">resolved</span>
          : <span className={`text-[9px] font-mono ${c.ts}`}>{timeAgo(item.lastUpdatedAt)}</span>}
      </div>
    </div>
  );
}

function PostItSection({
  notes, accent, label, icon, total, milestone, onGenerate, generating,
}: {
  notes: Notes | null;
  accent: 'cyan' | 'amber';
  label: string;
  icon: React.ReactNode;
  total: number;
  milestone: number;
  onGenerate: () => void;
  generating: boolean;
}) {
  const c = {
    cyan:  { header: 'text-cyan-400/70',  bar: 'from-cyan-500 to-cyan-400',  count: 'text-cyan-400/50',  dashed: 'border-cyan-500/[0.08]',  btn: 'hover:text-cyan-400' },
    amber: { header: 'text-amber-400/70', bar: 'from-amber-500 to-amber-400', count: 'text-amber-400/50', dashed: 'border-amber-500/[0.08]', btn: 'hover:text-amber-400' },
  }[accent];

  const active     = notes?.items.filter(n => n.status === 'active')     ?? [];
  const deprecated = notes?.items.filter(n => n.status === 'deprecated') ?? [];
  const progress   = Math.min((total / milestone) * 100, 100);

  return (
    <div className="flex flex-col gap-2">
      {/* Section header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1.5">
          {icon}
          <span className={`text-[10px] font-bold uppercase tracking-wider ${c.header}`}>{label}</span>
          <span className={`text-[9px] font-mono ${c.count}`}>{total}/{milestone}</span>
        </div>
        <button
          onClick={onGenerate}
          disabled={generating}
          className={`flex items-center gap-1 text-[9px] text-white/25 ${c.btn} transition-colors disabled:opacity-40`}
          title={`Force-generate ${label} notes from last ${milestone} trades`}
        >
          <RefreshCw className={`w-2.5 h-2.5 ${generating ? 'animate-spin' : ''}`} />
          {generating ? 'Analysing…' : 'Generate'}
        </button>
      </div>

      {/* Progress bar */}
      <div className="h-0.5 bg-white/[0.06] rounded overflow-hidden">
        <div className={`h-full bg-gradient-to-r ${c.bar} transition-all duration-500`}
          style={{ width: `${progress}%` }} />
      </div>

      {/* Post-its or empty state */}
      {active.length === 0 && deprecated.length === 0 ? (
        <div className={`rounded border ${c.dashed} border-dashed p-3 text-center`}>
          <p className="text-[10px] text-white/25">
            {generating
              ? 'LLM analysing your trades…'
              : total < milestone
              ? `${milestone - total} more trades · or click Generate`
              : 'Click Generate to analyse'}
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          {active.map((item, i) => <PostIt key={item.id} item={item} accent={accent} index={i} total={active.length} />)}
          {deprecated.length > 0 && (
            <details className="group">
              <summary className="text-[9px] text-white/20 cursor-pointer hover:text-white/40 list-none flex items-center gap-1">
                <span className="group-open:rotate-90 transition-transform inline-block">▶</span>
                {deprecated.length} resolved
              </summary>
              <div className="mt-1.5 space-y-1.5">
                {deprecated.map((item, i) => <PostIt key={item.id} item={item} accent={accent} index={i} total={deprecated.length} />)}
              </div>
            </details>
          )}
        </div>
      )}

      {notes && (
        <p className="text-[9px] text-white/20 font-mono">
          Cycle #{notes.cycleNumber} · {timeAgo(notes.generatedAt)}
        </p>
      )}
    </div>
  );
}

export default function ReportCard({
  report, reportLoading, reportHistory, onCloseReport, history, onGenerateReport,
}: ReportCardProps) {
  const total     = history.length;
  const globalRec = reportHistory?.globalRecommendation;

  const [gen50,     setGen50]     = useState(false);
  const [gen500,    setGen500]    = useState(false);
  const [genGlobal, setGenGlobal] = useState(false);
  const [genError,  setGenError]  = useState<string | null>(null);

  async function runGeneration(target: '50' | '500' | 'global') {
    const setter = target === '50' ? setGen50 : target === '500' ? setGen500 : setGenGlobal;
    setter(true);
    setGenError(null);
    try {
      // 3-minute timeout — OpenRouter free models can be slow under load
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), 180_000);

      const res = await fetch('/api/trading-bot/report-history', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ target }),
        signal: controller.signal,
      });
      clearTimeout(timer);

      if (!res.ok) {
        const err = await res.json().catch(() => ({ error: `HTTP ${res.status}` }));
        setGenError(err.error ?? `HTTP ${res.status}`);
      } else {
        onGenerateReport?.();
      }
    } catch (e: any) {
      setGenError(e.name === 'AbortError' ? 'Timed out — OpenRouter may be under load, try again' : String(e));
    } finally {
      setter(false);
    }
  }

  return (
    <div className="bg-white/[0.02] border border-white/[0.05] rounded flex flex-col min-h-0">

      {/* Header */}
      <div className="flex items-center justify-between px-4 py-2 border-b border-white/[0.05] shrink-0">
        <div className="flex items-center gap-1.5">
          <Brain className="w-3 h-3 text-violet-400/50" />
          <h3 className="text-[10px] font-semibold text-white/50 tracking-wide">Learning Board</h3>
        </div>
        <span className="text-[9px] text-white/20">{total} trades</span>
      </div>

      {genError && (
        <div className="mx-4 mt-2 px-2 py-1.5 rounded bg-red-500/10 border border-red-500/20 flex items-start justify-between gap-2">
          <p className="text-[10px] text-red-400 leading-snug">{genError}</p>
          <button onClick={() => setGenError(null)} className="text-red-400/60 hover:text-red-400 text-xs shrink-0">✕</button>
        </div>
      )}

      <div className="overflow-y-auto flex-1 min-h-0 px-4 py-3 space-y-4">

        {/* 50-Trade post-its */}
        <PostItSection
          notes={reportHistory?.notes50 ?? null}
          accent="cyan"
          label="50-Trade Insights"
          icon={<Target className="w-3 h-3 text-cyan-400/50" />}
          total={total}
          milestone={50}
          onGenerate={() => runGeneration('50')}
          generating={gen50}
        />

        {/* Divider */}
        <div className="border-t border-white/[0.04]" />

        {/* 500-Trade post-its */}
        <PostItSection
          notes={reportHistory?.notes500 ?? null}
          accent="amber"
          label="500-Trade Strategy"
          icon={<TrendingUp className="w-3 h-3 text-amber-400/50" />}
          total={total}
          milestone={500}
          onGenerate={() => runGeneration('500')}
          generating={gen500}
        />

        {/* Divider */}
        <div className="border-t border-white/[0.04]" />

        {/* Overall strategy */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-1.5">
              <Sparkles className="w-3 h-3 text-violet-400/60" />
              <span className="text-[10px] font-bold text-violet-300/70 uppercase tracking-wider">Overall Strategy</span>
            </div>
            <div className="flex items-center gap-2">
              {globalRec && (
                <span className="text-[9px] text-white/20 font-mono">{timeAgo(globalRec.lastUpdatedAt)}</span>
              )}
              <button
                onClick={() => runGeneration('global')}
                disabled={genGlobal}
                className="flex items-center gap-1 text-[9px] text-white/25 hover:text-violet-400 transition-colors disabled:opacity-40"
                title="Regenerate overall strategy from current notes"
              >
                <RefreshCw className={`w-2.5 h-2.5 ${genGlobal ? 'animate-spin' : ''}`} />
                {genGlobal ? 'Analysing…' : 'Generate'}
              </button>
            </div>
          </div>

          {globalRec ? (
            <div className="space-y-2">
              <div className="bg-violet-500/[0.06] border border-violet-500/[0.12] rounded p-3">
                <p className="text-xs leading-relaxed text-white/70">{globalRec.recommendation}</p>
              </div>
              {globalRec.keyInsights?.length > 0 && (
                <div className="space-y-1.5">
                  {globalRec.keyInsights.map((insight, i) => (
                    <div key={i} className="flex gap-2 items-start">
                      <span className="text-violet-400/50 text-[10px] mt-0.5 shrink-0">◆</span>
                      <p className="text-[10px] text-white/50 leading-snug">{insight}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ) : (
            <div className="border border-dashed border-violet-500/[0.1] rounded p-3 text-center">
              <p className="text-[10px] text-white/25">
                {genGlobal ? 'LLM synthesising strategy…' : 'Click Generate to synthesise from notes above'}
              </p>
            </div>
          )}
        </div>

        {/* Inline report result (when manually triggered) */}
        {report && !report.error && (
          <div className="border-t border-white/[0.05] pt-3 space-y-2">
            <div className="bg-white/[0.03] border border-white/[0.05] p-2 rounded">
              <div className="text-[10px] font-bold text-white/50 mb-1 uppercase">Latest Run</div>
              <div className="space-y-0.5 text-[10px] text-white/50 font-mono">
                <div className="flex justify-between"><span>WR</span><span className="text-emerald-400">{report.metrics?.winRate}%</span></div>
                <div className="flex justify-between"><span>P&L</span><span className={report.metrics?.totalPnL >= 0 ? 'text-emerald-400' : 'text-red-400'}>${report.metrics?.totalPnL}</span></div>
                <div className="flex justify-between"><span>PF</span><span>{report.metrics?.profitFactor}</span></div>
              </div>
            </div>
            {report.analysis && <p className="text-[10px] leading-relaxed text-white/45">{report.analysis}</p>}
            <button onClick={onCloseReport} className="w-full py-1 text-[9px] text-white/30 hover:text-white/60 transition-colors">Dismiss</button>
          </div>
        )}

        {report?.error && (
          <div className="border-t border-white/[0.05] pt-3 space-y-2">
            <div className="text-[10px] text-red-400 p-2 bg-red-500/10 rounded border border-red-500/15">{report.error}</div>
            <button onClick={onCloseReport} className="w-full py-1 text-[9px] text-white/30 hover:text-white/60 transition-colors">Dismiss</button>
          </div>
        )}
      </div>
    </div>
  );
}
