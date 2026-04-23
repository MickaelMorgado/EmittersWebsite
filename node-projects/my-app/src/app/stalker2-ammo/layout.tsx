import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "STALKER 2 Ammo Tracker",
  description: "Interactive ammo and weight management dashboard for S.T.A.L.K.E.R. 2. Track ammunition, manage inventory weight, and plan your loadout.",
  keywords: ["STALKER 2", "ammo tracker", "weight management", "inventory", "loadout", "game tools"],
};

export default function Stalker2AmmoLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
