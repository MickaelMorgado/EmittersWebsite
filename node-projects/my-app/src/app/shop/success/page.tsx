'use client';

import { Suspense, useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';

function SuccessContent() {
  const searchParams = useSearchParams();
  const sessionId = searchParams.get('session_id');
  const [downloadUrl, setDownloadUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (sessionId) {
      // In production, you'd verify the session with Stripe
      // and generate a secure download link
      setLoading(false);
      setDownloadUrl('/api/download?token=placeholder');
    } else {
      setError('No session ID found');
      setLoading(false);
    }
  }, [sessionId]);

  return (
    <div className="min-h-screen flex items-center justify-center px-6" style={{ backgroundColor: 'var(--shop-bg)' }}>
      <div className="max-w-md w-full text-center">
        {loading ? (
          <div>
            <div
              className="w-16 h-16 rounded-full mx-auto mb-6 flex items-center justify-center"
              style={{ backgroundColor: 'var(--shop-accent-dim)' }}
            >
              <svg className="w-8 h-8 animate-spin" fill="none" stroke="var(--shop-accent)" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
            </div>
            <p style={{ color: 'var(--shop-text-secondary)' }}>Verifying payment...</p>
          </div>
        ) : error ? (
          <div>
            <div
              className="w-16 h-16 rounded-full mx-auto mb-6 flex items-center justify-center"
              style={{ backgroundColor: 'rgba(255, 64, 129, 0.1)' }}
            >
              <svg className="w-8 h-8" fill="none" stroke="#ff4081" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </div>
            <h1 className="text-2xl font-bold mb-4" style={{ color: 'var(--shop-text-primary)' }}>
              Something went wrong
            </h1>
            <p className="mb-6" style={{ color: 'var(--shop-text-secondary)' }}>
              {error}
            </p>
            <a
              href="/shop"
              className="shop-btn-accent inline-block py-3 px-6 rounded font-medium uppercase tracking-wider text-sm"
            >
              Back to Shop
            </a>
          </div>
        ) : (
          <div>
            <div
              className="w-16 h-16 rounded-full mx-auto mb-6 flex items-center justify-center"
              style={{ backgroundColor: 'var(--shop-accent-dim)' }}
            >
              <svg className="w-8 h-8" fill="none" stroke="var(--shop-accent)" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h1 className="text-2xl font-bold mb-4" style={{ color: 'var(--shop-text-primary)' }}>
              Payment Successful
            </h1>
            <p className="mb-8" style={{ color: 'var(--shop-text-secondary)' }}>
              Thank you for your purchase. Your download is ready.
            </p>
            {downloadUrl && (
              <a
                href={downloadUrl}
                className="shop-btn-accent inline-block py-3 px-8 rounded font-medium uppercase tracking-wider text-sm mb-4"
              >
                Download Files
              </a>
            )}
            <div>
              <a
                href="/shop"
                className="text-sm underline"
                style={{ color: 'var(--shop-text-muted)' }}
              >
                Back to Shop
              </a>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default function ShopSuccessPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: 'var(--shop-bg)' }}>
        <div className="w-8 h-8 border-2 border-current border-t-transparent rounded-full animate-spin" style={{ color: 'var(--shop-accent)' }} />
      </div>
    }>
      <SuccessContent />
    </Suspense>
  );
}