import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Mickael Morgado",
  description: "Personal website and portfolio of Mickael Morgado - developer, creator of Emitters developer tools.",
  keywords: ["Mickael Morgado", "portfolio", "developer", "Emitters"],
};

export default function MikaLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
