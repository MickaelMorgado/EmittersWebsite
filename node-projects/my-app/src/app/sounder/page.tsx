"use client";

import { VersionBadge } from "@/components/VersionBadge";
import ThreeAudioVisualizer from "./ThreeAudioVisualizer";

export default function SounderPage() {
  return (
    <>
      <ThreeAudioVisualizer />
      <VersionBadge projectName="sounder" />
    </>
  );
}
