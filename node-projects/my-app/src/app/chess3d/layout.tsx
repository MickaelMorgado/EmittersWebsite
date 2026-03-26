import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "3D Chess",
  description: "Multiplayer 3D Chess game with Three.js",
  keywords: ["3D Chess", "Multiplayer", "Three.js"],
};

export default function Chess3DLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
