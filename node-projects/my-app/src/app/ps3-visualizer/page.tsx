"use client";

import ControllerExperience from "./ControllerExperience";
import { VersionBadge } from "@/components/VersionBadge";

export default function PS3VisualizerPage() {
  return (
    <>
      <ControllerExperience />
      <VersionBadge projectName="ps3-visualizer" />
    </>
  );
}
