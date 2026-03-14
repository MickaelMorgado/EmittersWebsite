"use client";

import { AgentSession } from "../types";
import { Activity, Clock, MessageSquare, Trash2, Bot } from "lucide-react";
import { useState } from "react";

interface AgentCardProps {
  agent: AgentSession;
  onSelect: (agent: AgentSession) => void;
  onKill: (sessionKey: string) => void;
  isSelected?: boolean;
}

const statusColors = {
  running: "bg-green-500/20 text-green-400 border-green-500/30",
  completed: "bg-blue-500/20 text-blue-400 border-blue-500/30",
  archived: "bg-gray-500/20 text-gray-400 border-gray-500/30",
  error: "bg-red-500/20 text-red-400 border-red-500/30",
};

const modelLabels: Record<string, string> = {
  "anthropic/claude-haiku-4-5": "Haiku",
  "anthropic/claude-sonnet-4-5": "Sonnet",
  "anthropic/claude-opus-4-6": "Opus",
  "openai/gpt-5.1-codex": "Codex",
};

export function AgentCard({ agent, onSelect, onKill, isSelected }: AgentCardProps) {
  const [isKilling, setIsKilling] = useState(false);

  const handleKill = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!confirm("Are you sure you want to kill this agent?")) return;
    
    setIsKilling(true);
    try {
      await onKill(agent.sessionKey);
    } finally {
      setIsKilling(false);
    }
  };

  const formatTime = (dateStr: string) => {
    const date = new Date(dateStr);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    
    if (diffMins < 1) return "Just now";
    if (diffMins < 60) return `${diffMins}m ago`;
    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return `${diffHours}h ago`;
    return date.toLocaleDateString();
  };

  return (
    <div
      onClick={() => onSelect(agent)}
      className={`
        group relative cursor-pointer rounded-xl border p-4 transition-all duration-200
        ${isSelected 
          ? "border-cyan-500/50 bg-cyan-500/10" 
          : "border-white/10 bg-white/5 hover:border-white/20 hover:bg-white/10"
        }
      `}
    >
      {/* Status indicator */}
      <div className={`absolute right-3 top-3 rounded-full px-2 py-0.5 text-xs font-medium border ${statusColors[agent.status]}`}>
        {agent.status}
      </div>

      {/* Header */}
      <div className="flex items-start gap-3 pr-16">
        <div className={`rounded-lg p-2 ${agent.status === "running" ? "bg-cyan-500/20" : "bg-white/10"}`}>
          <Bot className={`h-5 w-5 ${agent.status === "running" ? "text-cyan-400" : "text-white/50"}`} />
        </div>
        <div className="min-w-0 flex-1">
          <h3 className="truncate font-medium text-white">
            {agent.label || agent.agentId}
          </h3>
          <p className="text-sm text-white/50 truncate">
            {modelLabels[agent.model || ""] || agent.model || agent.agentId}
          </p>
        </div>
      </div>

      {/* Footer */}
      <div className="mt-3 flex items-center justify-between text-xs text-white/40">
        <div className="flex items-center gap-3">
          <span className="flex items-center gap-1">
            <Clock className="h-3 w-3" />
            {formatTime(agent.createdAt)}
          </span>
        </div>
        
        {agent.status === "running" && (
          <button
            onClick={handleKill}
            disabled={isKilling}
            className="flex items-center gap-1 rounded px-2 py-1 text-red-400 hover:bg-red-500/20 disabled:opacity-50"
          >
            <Trash2 className="h-3 w-3" />
            {isKilling ? "Killing..." : "Kill"}
          </button>
        )}
      </div>

      {/* Selected indicator */}
      {isSelected && (
        <div className="absolute inset-0 rounded-xl border-2 border-cyan-500/30 pointer-events-none" />
      )}
    </div>
  );
}
