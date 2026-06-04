export type AgentStatus = 'approved' | 'rejected' | 'analyzing' | 'offline';
type AccentColor = 'cyan' | 'emerald' | 'red' | 'violet';

interface AgentStatusBadgeProps {
  status: AgentStatus;
  color: AccentColor;
  /** Override the displayed label */
  label?: string;
}

const approvedStyles: Record<AccentColor, string> = {
  cyan:    'bg-cyan-500/20 text-cyan-400 border border-cyan-500/30',
  emerald: 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30',
  red:     'bg-red-500/20 text-red-400 border border-red-500/30',
  violet:  'bg-violet-500/20 text-violet-400 border border-violet-500/30',
};

const STATUS_STYLES: Record<AgentStatus, () => string> = {
  approved:  ()      => 'bg-green-500/20 text-green-400 border border-green-500/30',
  rejected:  ()      => 'bg-red-500/15 text-red-400 border border-red-500/25',
  analyzing: ()      => 'bg-yellow-500/15 text-yellow-400 border border-yellow-500/20',
  offline:   ()      => 'bg-slate-500/10 text-slate-400 border border-slate-500/20',
};

const DEFAULT_LABELS: Record<AgentStatus, string> = {
  approved:  'APPROVED',
  rejected:  'REJECTED',
  analyzing: 'ANALYZING',
  offline:   'OFFLINE',
};

export default function AgentStatusBadge({ status, color, label }: AgentStatusBadgeProps) {
  return (
    <span className={`text-[10px] px-1.5 py-0.5 rounded font-bold ${STATUS_STYLES[status](color)}`}>
      {label ?? DEFAULT_LABELS[status]}
    </span>
  );
}
