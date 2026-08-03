import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Shop | Mickael Morgado',
  description: 'Digital products and templates for creators.',
};

export default function ShopLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}