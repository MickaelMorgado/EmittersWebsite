"use client";

import { AgentDashboard } from "./components/AgentDashboard";
import { VersionBadge } from "@/components/VersionBadge";

export default function MissionControlPage() {
  return (
    <div className="min-h-screen bg-black text-white">
      <div className="mx-auto max-w-7xl px-6 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold tracking-tight">Mission Control</h1>
          <p className="mt-2 text-white/60">
            Manage and monitor your AI agents
          </p>
        </div>

        {/* Dashboard */}
        <AgentDashboard />
      </div>
      
      <VersionBadge projectName="mission-control" />
    </div>
  );
}
