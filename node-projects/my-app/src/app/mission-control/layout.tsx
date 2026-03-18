import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Mission Control - AI Agent Dashboard",
  description: "AI agent management dashboard for OpenClaw. Monitor, control, and manage AI agents in real-time.",
  keywords: ["mission control", "AI agent", "OpenClaw", "dashboard", "agent management"],
};

export default function MissionControlLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
