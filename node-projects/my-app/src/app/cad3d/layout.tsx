import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "3D CAD App",
  description: "Simple 3D CAD software for creating and manipulating 3D objects. Design, rotate, and export 3D models directly in your browser.",
  keywords: ["CAD", "3D design", "3D modeling", "object creation", "browser CAD", "3D editor"],
};

export default function CAD3DLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
