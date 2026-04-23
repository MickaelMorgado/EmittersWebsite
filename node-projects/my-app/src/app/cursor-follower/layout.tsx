import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Cursor Follower - Portrait Streamer",
  description: "Portrait 9:16 live streaming tool that follows your mouse cursor. Create vertical video streams centered on your cursor for TikTok, streaming, and more.",
  keywords: ["cursor follower", "portrait streamer", "9:16 stream", "screen capture", "tiktok stream", "vertical video", "mouse tracking"],
};

export default function CursorFollowerLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
