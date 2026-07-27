import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Data Visualization",
  description: "Interactive charts and data visualizations for finance, metrics, and reports.",
};

export default function DataVizLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
