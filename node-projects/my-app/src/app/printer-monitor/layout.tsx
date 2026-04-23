import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "3D Printer Monitor",
  description: "Monitor multiple 3D-printer camera feeds in real-time. Watch your prints remotely with multi-camera support and OctoPrint integration.",
  keywords: ["3D printer", "printer monitor", "OctoPrint", "camera feed", "print monitoring", "timelapse"],
};

export default function PrinterMonitorLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
