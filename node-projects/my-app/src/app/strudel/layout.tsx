import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Strudel Live Code",
  description: "Create music with code - live coding electronic music. A browser-based live coding environment for producing beats and melodies.",
  keywords: ["Strudel", "live coding", "music", "live code", "electronic music", "beat maker", "TidalCycles"],
};

export default function StrudelLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
