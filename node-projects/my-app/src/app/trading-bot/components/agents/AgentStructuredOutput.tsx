export interface OutputField {
  key: string;
  value: string | number | boolean | null | undefined;
}

function Value({ v }: { v: string | number | boolean | null | undefined }) {
  if (v === null || v === undefined)
    return <span className="text-white/20 italic">null</span>;
  if (typeof v === 'boolean')
    return <span className={v ? 'text-emerald-400' : 'text-red-400'}>{String(v)}</span>;
  if (typeof v === 'number')
    return <span className="text-sky-400">{v}</span>;
  // string — quote it, colour by semantic value
  const color =
    v === 'approved'  ? 'text-emerald-400' :
    v === 'rejected'  ? 'text-red-400'     :
    v === 'analyzing' ? 'text-yellow-400'  :
    v === 'offline'   ? 'text-slate-500'   :
    v === 'BUY'       ? 'text-emerald-400' :
    v === 'SELL'      ? 'text-red-400'     :
    v === 'Bullish'   ? 'text-emerald-400' :
    v === 'Bearish'   ? 'text-red-400'     :
    'text-amber-300/80';
  return <span className={color}>"{v}"</span>;
}

interface AgentStructuredOutputProps {
  fields: OutputField[];
}

export default function AgentStructuredOutput({ fields }: AgentStructuredOutputProps) {
  return (
    <div className="border-t border-white/[0.05] pt-2 mt-1">
      <span className="text-[9px] font-bold text-white/20 uppercase tracking-widest">Structured Output</span>
      <div className="mt-1.5 bg-black/20 rounded border border-white/[0.04] px-2 py-1.5 font-mono text-[9px]">
        <div className="text-white/15">{'{'}</div>
        <div className="space-y-0.5 pl-2">
          {fields.map(({ key, value }, i) => (
            <div key={key} className="flex items-baseline gap-1.5">
              <span className="text-white/30 shrink-0">"{key}":</span>
              <Value v={value} />
              {i < fields.length - 1 && <span className="text-white/15">,</span>}
            </div>
          ))}
        </div>
        <div className="text-white/15">{'}'}</div>
      </div>
    </div>
  );
}
