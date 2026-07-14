'use client';

import { useEffect } from 'react';
import * as Sentry from '@sentry/nextjs';

// Renders when the root layout itself throws — it must own <html>/<body> and
// avoid app-level dependencies (i18n, theme, providers) which may have failed.
export default function GlobalError({
  error,
  reset,
}: {
  error: Error;
  reset: () => void;
}) {
  useEffect(() => {
    // No-op unless the client SDK initialized (instrumentation-client.ts,
    // DSN-gated) — safe to call unconditionally.
    Sentry.captureException(error);
  }, [error]);
  return (
    // lang="en" is deliberate: this fallback renders without i18n (which may be
    // what failed) and its copy is hardcoded English, so "en" is accurate.
    <html lang="en">
      <body
        style={{
          minHeight: '100vh',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '1rem',
          padding: '1.5rem',
          textAlign: 'center',
          fontFamily:
            'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
        }}
      >
        <h1 style={{ fontSize: '1.5rem', fontWeight: 600 }}>
          Something went wrong
        </h1>
        <p style={{ color: '#666', maxWidth: '28rem' }}>
          A critical error occurred. Please try again.
        </p>
        <button
          type="button"
          onClick={reset}
          style={{
            padding: '0.5rem 1rem',
            borderRadius: '0.375rem',
            border: '1px solid #ccc',
            background: '#fff',
            cursor: 'pointer',
          }}
        >
          Retry
        </button>
      </body>
    </html>
  );
}
