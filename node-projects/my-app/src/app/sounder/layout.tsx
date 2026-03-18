import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Sounder - Random Music Generator",
  description: "A sound design tool for creating randomized music. Generate unique beats, melodies, and sound patterns with advanced synthesis.",
  keywords: ["sounder", "music generator", "sound design", "random music", "beat maker", "synthesizer"],
};

export default function SounderLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
