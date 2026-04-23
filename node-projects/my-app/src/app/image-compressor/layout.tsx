import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Media Processor",
  description: "Compress images and crop videos with preset ratios for TikTok, YouTube, and Instagram. Optimize your content for any platform.",
  keywords: ["media processor", "image compressor", "video crop", "TikTok", "YouTube", "Instagram", "content optimization"],
};

export default function ImageCompressorLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
