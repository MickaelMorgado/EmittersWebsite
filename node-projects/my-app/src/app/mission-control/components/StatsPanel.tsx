"use client";

import { AgentSession } from "../types";
import { Activity, Users, Clock, Zap } from "lucide-react";

interface StatsPanelProps {
  agents: AgentSession[];
}

export function StatsPanel({ agents }: StatsPanelProps) {
  const running = agents.filter((a) => a.status === "running").length;
  const completed = agents.filter((a) => a.status === "completed").length;
  const total = agents.length;

  const runningAgents = agents.filter((a) => a.status === "running");
  
  const getModelStats = () => {
    const stats: Record<string, number> = {};
    agents.forEach((a) => {
      const model = a.model || "default";
      stats[model] = (stats[model] || 0) + 1;
    });
    return stats;
  };

  const modelStats = getModelStats();

  return (
    <div className="rounded-xl border border-white/10 bg-white/5 p-4">
      <div className="flex items-center gap-2 text-white mb-4">
        <Activity className="h-5 w-5 text-cyan-400" />
        <h3 className="font-medium">Mission Stats</h3>
      </div>

      <div className="grid grid-cols-3 gap-3">
        <div className="rounded-lg bg-green-500/10 border border-green-500/20 p-3 text-center">
          <div className="text-2xl font-bold text-green-400">{running}</div>
          <div className="text-xs text-green-400/70">Running</div>
        </div>
        <div className="rounded-lg bg-blue-500/10 border border-blue-500/20 p-3 text-center">
          <div className="text-2xl font-bold text-blue-400">{completed}</div>
          <div className="text-xs text-blue-400/70">Completed</div>
        </div>
        <div className="rounded-lg bg-white/10 border border-white/10 p-3 text-center">
          <div className="text-2xl font-bold text-white">{total}</div>
          <div className="text-xs text-white/50">Total</div>
        </div>
      </div>

      {Object.keys(modelStats).length > 0 && (
        <div className="mt-4 pt-4 border-t border-white/10">
          <div className="flex items-center gap-2 text-sm text-white/60 mb-2">
            <Zap className="h-4 w-4" />
            Model Distribution
          </div>
          <div className="space-y-1">
            {Object.entries(modelStats).map(([model, count]) => {
              const percentage = total > 0 ? (count / total) * 100 : 0;
              const label = model.includes("haiku") ? "Haiku" 
                : model.includes("sonnet") ? "Sonnet" 
                : model.includes("opus") ? "Opus"
                : model.includes("codex") ? "Codex"
                : "Default";
              
              return (
                <div key={model} className="flex items-center gap-2">
                  <span className="text-xs text-white/50 w-16">{label}</span>
                  <div className="flex-1 h-1.5 bg-white/10 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-cyan-500/50 rounded-full"
                      style={{ width: `${percentage}%` }}
                    />
                  </div>
                  <span className="text-xs text-white/40 w-6 text-right">{count}</span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {runningAgents.length > 0 && (
        <div className="mt-4 pt-4 border-t border-white/10">
          <div className="flex items-center gap-2 text-sm text-white/60 mb-2">
            <Users className="h-4 w-4" />
            Active Agents
          </div>
          <div className="space-y-1">
            {runningAgents.slice(0, 5).map((agent) => (
              <div key={agent.sessionKey} className="flex items-center justify-between text-sm">
                <span className="text-white/70 truncate max-w-[150px]">
                  {agent.label || agent.agentId}
                </span>
                <span className="text-green-400/70 text-xs">
                  {agent.status}
                </span>
              </div>
            ))}
            {runningAgents.length > 5 && (
              <div className="text-xs text-white/40">
                +{runningAgents.length - 5} more
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
