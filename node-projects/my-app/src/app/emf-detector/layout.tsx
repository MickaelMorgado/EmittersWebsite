import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "EMF Detector Simulator",
  description: "Portable radiation scanner with real-time sonar feedback. Inspired by Stalker: Heart of Chornobyl specialized artifacts detection gear.",
  keywords: ["EMF detector", "ghost hunter", "radiation scanner", "sonic feedback", "Stalker", "artifact detector"],
};

export default function EMFDetectorLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
