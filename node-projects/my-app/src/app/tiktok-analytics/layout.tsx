import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "TikTok Analytics",
  description: "Connect your TikTok account to load and analyze your video metrics. Track views, engagement, and growth with detailed analytics.",
  keywords: ["TikTok analytics", "video metrics", "TikTok stats", "engagement", "views", "followers"],
};

export default function TikTokAnalyticsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
