"use client";

import dynamic from "next/dynamic";

const StrudelLive = dynamic(
  () => import("@/components/strudel/StrudelLive"),
  { ssr: false }
);

export default function StrudelPage() {
  return <StrudelLive />;
}
