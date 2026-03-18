import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Data Visualizer - 3D Interactive Charts",
  description: "Interactive 3D data visualization tool. Create stunning 3D charts and visualizations with real-time data rendering.",
  keywords: ["data visualizer", "3D charts", "visualization", "interactive charts", "data analysis"],
};

export default function DataVisualizerLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
