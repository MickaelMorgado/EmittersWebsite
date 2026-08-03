'use client';

import Link from 'next/link';

export default function ShopCancelPage() {
  return (
    <div className="min-h-screen flex items-center justify-center px-6" style={{ backgroundColor: 'var(--shop-bg)' }}>
      <div className="max-w-md w-full text-center">
        <div
          className="w-16 h-16 rounded-full mx-auto mb-6 flex items-center justify-center"
          style={{ backgroundColor: 'var(--shop-accent-dim)' }}
        >
          <svg className="w-8 h-8" fill="none" stroke="var(--shop-accent)" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </div>
        <h1 className="text-2xl font-bold mb-4" style={{ color: 'var(--shop-text-primary)' }}>
          Checkout Cancelled
        </h1>
        <p className="mb-8" style={{ color: 'var(--shop-text-secondary)' }}>
          No worries. Your cart is still waiting if you change your mind.
        </p>
        <Link
          href="/shop"
          className="shop-btn-accent inline-block py-3 px-8 rounded font-medium uppercase tracking-wider text-sm"
        >
          Back to Shop
        </Link>
      </div>
    </div>
  );
}