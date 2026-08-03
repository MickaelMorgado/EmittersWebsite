'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

const products = [
  {
    id: 'beat-sync-template',
    name: 'Beat-Sync Video Edit Template',
    description: 'Workflow files + guide for BPM-synced movie edits. Includes FFmpeg scripts, workflow files, and step-by-step guide.',
    price: 20,
    priceId: 'price_1U0UJK0i2KJMhmBkyCT8L7V2',
    features: [
      'FFmpeg beat-detection scripts',
      'Premiere Pro / DaVinci workflow',
      'Step-by-step PDF guide',
      '5 example project files',
    ],
  },
];

export default function ShopPage() {
  const router = useRouter();
  const [loading, setLoading] = useState<string | null>(null);

  const handleCheckout = async (priceId: string, productId: string) => {
    setLoading(productId);
    try {
      const res = await fetch('/api/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ priceId }),
      });
      const data = await res.json();
      if (data.url) {
        window.location.href = data.url;
      }
    } catch (error) {
      console.error('Checkout error:', error);
    } finally {
      setLoading(null);
    }
  };

  return (
    <div className="min-h-screen" style={{ backgroundColor: 'var(--shop-bg)' }}>
      {/* Navigation */}
      <nav className="fixed top-0 w-full z-50" style={{ backgroundColor: 'rgba(10, 10, 10, 0.9)', borderBottom: '1px solid var(--shop-border)' }}>
        <div className="max-w-6xl mx-auto px-6 py-4 flex justify-between items-center">
          <a href="/mika" className="text-xl font-bold uppercase" style={{ color: 'var(--shop-text-primary)' }}>
            Mickael
          </a>
          <div className="flex items-center gap-6">
            <a href="/mika" className="text-sm uppercase tracking-wider" style={{ color: 'var(--shop-text-secondary)' }}>
              Portfolio
            </a>
            <span className="text-sm uppercase tracking-wider" style={{ color: 'var(--shop-accent)' }}>
              Shop
            </span>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="pt-32 pb-16 px-6">
        <div className="max-w-6xl mx-auto text-center">
          <h1
            className="text-4xl md:text-5xl font-bold uppercase tracking-wider mb-4"
            style={{ color: 'var(--shop-text-primary)' }}
          >
            Digital Products
          </h1>
          <p className="text-lg max-w-2xl mx-auto" style={{ color: 'var(--shop-text-secondary)' }}>
            Tools and templates for creators. Built with real workflows, not generic advice.
          </p>
        </div>
      </section>

      {/* Products Grid */}
      <section className="pb-24 px-6">
        <div className="max-w-6xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {products.map((product) => (
              <div
                key={product.id}
                className="shop-card-glow rounded-lg p-6 flex flex-col"
                style={{ backgroundColor: 'var(--shop-surface)' }}
              >
                {/* Product Header */}
                <div className="mb-6">
                  <div
                    className="w-12 h-12 rounded-lg flex items-center justify-center mb-4"
                    style={{ backgroundColor: 'var(--shop-accent-dim)' }}
                  >
                    <svg
                      className="w-6 h-6"
                      fill="none"
                      stroke="var(--shop-accent)"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z"
                      />
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                      />
                    </svg>
                  </div>
                  <h2 className="text-xl font-bold mb-2" style={{ color: 'var(--shop-text-primary)' }}>
                    {product.name}
                  </h2>
                  <p className="text-sm" style={{ color: 'var(--shop-text-secondary)' }}>
                    {product.description}
                  </p>
                </div>

                {/* Features */}
                <ul className="mb-6 flex-1 space-y-2">
                  {product.features.map((feature, i) => (
                    <li key={i} className="flex items-start gap-2 text-sm" style={{ color: 'var(--shop-text-secondary)' }}>
                      <span style={{ color: 'var(--shop-accent)' }}>→</span>
                      {feature}
                    </li>
                  ))}
                </ul>

                {/* Price & CTA */}
                <div className="mt-auto">
                  <div className="flex items-baseline gap-1 mb-4">
                    <span className="text-3xl font-bold" style={{ color: 'var(--shop-text-primary)', fontFamily: 'var(--font-mono)' }}>
                      €{product.price}
                    </span>
                    <span className="text-sm" style={{ color: 'var(--shop-text-muted)' }}>
                      one-time
                    </span>
                  </div>
                  <button
                    onClick={() => handleCheckout(product.priceId, product.id)}
                    disabled={loading === product.id}
                    className="shop-btn-accent w-full py-3 px-6 rounded font-medium uppercase tracking-wider text-sm"
                  >
                    {loading === product.id ? 'Redirecting...' : 'Buy Now'}
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 px-6" style={{ borderTop: '1px solid var(--shop-border)' }}>
        <div className="max-w-6xl mx-auto text-center">
          <p className="text-sm" style={{ color: 'var(--shop-text-muted)' }}>
            Powered by Stripe. Secure checkout.
          </p>
        </div>
      </footer>
    </div>
  );
}