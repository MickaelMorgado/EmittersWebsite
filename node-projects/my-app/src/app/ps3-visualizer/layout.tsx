import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "PS3 Controller Visualizer",
  description: "DualShock 3 telemetry visualization with particle-driven buttons. Real-time 3D controller state visualization for streaming.",
  keywords: ["PS3 controller", "DualShock", "controller visualizer", "streaming", "particles", "telemetry"],
};

export default function PS3VisualizerLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
