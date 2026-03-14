"use client";

import { useState, useEffect, useCallback } from "react";
import { AgentSession } from "../types";
import { AgentCard } from "./AgentCard";
import { SpawnAgentForm } from "./SpawnAgentForm";
import { ChatPanel } from "./ChatPanel";
import { StatsPanel } from "./StatsPanel";
import { RefreshCw, Loader2, AlertCircle, Plus, X } from "lucide-react";

const GATEWAY_URL = process.env.NEXT_PUBLIC_OPENCLAW_GATEWAY_URL || "http://127.0.0.1:18789";

export function AgentDashboard() {
  const [agents, setAgents] = useState<AgentSession[]>([]);
  const [selectedAgent, setSelectedAgent] = useState<AgentSession | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSpawning, setIsSpawning] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [showSpawnForm, setShowSpawnForm] = useState(false);

  const loadAgents = useCallback(async () => {
    try {
      const response = await fetch("/api/openclaw/sessions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ includeArchived: false }),
      });

      if (!response.ok) {
        throw new Error(`Gateway error: ${response.status}`);
      }

      const data = await response.json();
      
      if (data.content) {
        try {
          const parsed = JSON.parse(data.content);
          const sessions = Array.isArray(parsed) ? parsed : parsed.sessions || [];
          setAgents(sessions);
          setIsConnected(true);
          setError(null);
        } catch {
          setAgents([]);
        }
      } else {
        setAgents([]);
      }
    } catch (err) {
      console.error("Failed to load agents:", err);
      setError(err instanceof Error ? err.message : "Connection failed");
      setIsConnected(false);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadAgents();
    const interval = setInterval(loadAgents, 3000);
    return () => clearInterval(interval);
  }, [loadAgents]);

  const handleSpawn = async (params: {
    task: string;
    model?: string;
    label?: string;
    thinking?: boolean;
  }) => {
    setIsSpawning(true);
    try {
      const response = await fetch("/api/openclaw/spawn", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...params,
          mode: "run",
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to spawn agent");
      }

      await loadAgents();
    } catch (err) {
      console.error("Spawn error:", err);
      setError("Failed to spawn agent");
    } finally {
      setIsSpawning(false);
    }
  };

  const handleKill = async (sessionKey: string) => {
    try {
      const response = await fetch("/api/openclaw/delete", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sessionKey }),
      });

      if (!response.ok) {
        throw new Error("Failed to kill agent");
      }

      if (selectedAgent?.sessionKey === sessionKey) {
        setSelectedAgent(null);
      }

      await loadAgents();
    } catch (err) {
      console.error("Kill error:", err);
    }
  };

  if (isLoading && agents.length === 0) {
    return (
      <div className="flex h-96 items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-cyan-400" />
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
      {/* Left Column - Agent List & Stats */}
      <div className="space-y-4 lg:col-span-1">
        {/* Connection Status */}
        <div className={`rounded-lg border px-4 py-2 text-sm flex items-center justify-between ${
          isConnected 
            ? "bg-green-500/10 border-green-500/20 text-green-400"
            : "bg-red-500/10 border-red-500/20 text-red-400"
        }`}>
          <span className="flex items-center gap-2">
            {isConnected ? "Connected" : "Disconnected"}
          </span>
          <span className="text-xs opacity-70">{GATEWAY_URL}</span>
        </div>

        {error && (
          <div className="rounded-lg border border-red-500/20 bg-red-500/10 p-3 text-sm text-red-400 flex items-start gap-2">
            <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
            {error}
          </div>
        )}

        {/* Stats */}
        <StatsPanel agents={agents} />

        {/* Spawn Form - Collapsible */}
        {showSpawnForm ? (
          <div className="relative">
            <button
              onClick={() => setShowSpawnForm(false)}
              className="absolute -top-2 -right-2 z-10 rounded-full bg-white/10 p-1 text-white/60 hover:bg-white/20"
            >
              <X className="h-4 w-4" />
            </button>
            <SpawnAgentForm onSpawn={handleSpawn} isSpawning={isSpawning} />
          </div>
        ) : (
          <button
            onClick={() => setShowSpawnForm(true)}
            className="w-full flex items-center justify-center gap-2 rounded-xl border border-dashed border-white/20 bg-white/5 py-3 text-sm text-white/60 hover:border-cyan-500/50 hover:bg-cyan-500/10 hover:text-cyan-400 transition-all"
          >
            <Plus className="h-4 w-4" />
            Spawn Agent
          </button>
        )}

        {/* Agent List */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-medium text-white/60">Active Agents</h3>
            <button
              onClick={loadAgents}
              className="rounded p-1 text-white/40 hover:bg-white/10"
            >
              <RefreshCw className="h-4 w-4" />
            </button>
          </div>
          
          {agents.length === 0 ? (
            <p className="text-sm text-white/40 text-center py-8">
              No active agents
            </p>
          ) : (
            <div className="space-y-2 max-h-[300px] overflow-y-auto">
              {agents.map((agent) => (
                <AgentCard
                  key={agent.sessionKey}
                  agent={agent}
                  onSelect={setSelectedAgent}
                  onKill={handleKill}
                  isSelected={selectedAgent?.sessionKey === agent.sessionKey}
                />
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Right Column - Chat Panel */}
      <div className="lg:col-span-2">
        <ChatPanel 
          agent={selectedAgent} 
          onRefresh={loadAgents}
        />
      </div>
    </div>
  );
}
