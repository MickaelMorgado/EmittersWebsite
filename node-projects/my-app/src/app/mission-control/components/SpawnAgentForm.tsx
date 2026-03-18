"use client";

import { useState } from "react";
import { Rocket, Loader2 } from "lucide-react";
import { SpawnAgentParams } from "../types";

interface SpawnAgentFormProps {
  onSpawn: (params: SpawnAgentParams) => Promise<void>;
  isSpawning: boolean;
}

const modelOptions = [
  { value: "anthropic/claude-haiku-4-5", label: "Haiku (Fast)" },
  { value: "anthropic/claude-sonnet-4-5", label: "Sonnet (Balanced)" },
  { value: "anthropic/claude-opus-4-6", label: "Opus (Power)" },
  { value: "openai/gpt-5.1-codex", label: "Codex" },
];

export function SpawnAgentForm({ onSpawn, isSpawning }: SpawnAgentFormProps) {
  const [task, setTask] = useState("");
  const [model, setModel] = useState("anthropic/claude-haiku-4-5");
  const [label, setLabel] = useState("");
  const [thinking, setThinking] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!task.trim()) return;

    await onSpawn({
      task: task.trim(),
      model,
      label: label.trim() || undefined,
      thinking,
    });

    setTask("");
    setLabel("");
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4 rounded-xl border border-white/10 bg-white/5 p-4">
      <div className="flex items-center gap-2 text-white">
        <Rocket className="h-5 w-5 text-cyan-400" />
        <h3 className="font-medium">Spawn New Agent</h3>
      </div>

      <div>
        <label className="block text-sm text-white/60 mb-1">Task Description</label>
        <textarea
          value={task}
          onChange={(e) => setTask(e.target.value)}
          placeholder="What should this agent do?"
          className="w-full rounded-lg border border-white/10 bg-black/30 px-3 py-2 text-sm text-white placeholder:text-white/30 focus:border-cyan-500/50 focus:outline-none resize-none"
          rows={3}
          disabled={isSpawning}
        />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-sm text-white/60 mb-1">Model</label>
          <select
            value={model}
            onChange={(e) => setModel(e.target.value)}
            className="w-full rounded-lg border border-white/10 bg-black/30 px-3 py-2 text-sm text-white focus:border-cyan-500/50 focus:outline-none"
            disabled={isSpawning}
          >
            {modelOptions.map((opt) => (
              <option key={opt.value} value={opt.value} className="bg-black">
                {opt.label}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm text-white/60 mb-1">Label (optional)</label>
          <input
            type="text"
            value={label}
            onChange={(e) => setLabel(e.target.value)}
            placeholder="e.g., Frontend Fix"
            className="w-full rounded-lg border border-white/10 bg-black/30 px-3 py-2 text-sm text-white placeholder:text-white/30 focus:border-cyan-500/50 focus:outline-none"
            disabled={isSpawning}
          />
        </div>
      </div>

      <label className="flex items-center gap-2 text-sm text-white/60">
        <input
          type="checkbox"
          checked={thinking}
          onChange={(e) => setThinking(e.target.checked)}
          className="rounded border-white/20 bg-black/30"
          disabled={isSpawning}
        />
        Enable thinking (slower but more thorough)
      </label>

      <button
        type="submit"
        disabled={!task.trim() || isSpawning}
        className="w-full flex items-center justify-center gap-2 rounded-lg bg-cyan-500/20 hover:bg-cyan-500/30 disabled:opacity-50 disabled:cursor-not-allowed px-4 py-2.5 text-sm font-medium text-cyan-300 transition-colors"
      >
        {isSpawning ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin" />
            Spawning...
          </>
        ) : (
          <>
            <Rocket className="h-4 w-4" />
            Spawn Agent
          </>
        )}
      </button>
    </form>
  );
}
