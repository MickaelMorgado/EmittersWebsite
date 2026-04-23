import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Camera Effects",
  description: "Real-time camera filters and visual effects. Add stunning visual overlays, motion tracking, and creative effects to your webcam feed.",
  keywords: ["camera effects", "webcam", "filters", "visual effects", "motion capture", "AR effects"],
};

export default function CameraEffectsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
