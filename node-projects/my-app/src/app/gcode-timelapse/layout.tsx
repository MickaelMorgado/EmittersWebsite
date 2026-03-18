import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "G-code Timelapse",
  description: "Minimalist 3D print timelapse visualization. Watch your 3D prints come to life with smooth, professional timelapses.",
  keywords: ["G-code", "timelapse", "3D print", "printer", "visualization", "printing"],
};

export default function GcodeTimelapseLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
