'use client';

import { type ReactNode, useEffect, useState } from 'react';
import { env } from '@/config/env';

const mockingEnabled = env.NEXT_PUBLIC_API_MOCKING === 'enabled';

/**
 * Starts the MSW browser worker before rendering children when API mocking is
 * enabled (`NEXT_PUBLIC_API_MOCKING=enabled`), so no request escapes the mock.
 * When mocking is off — the default — this is a transparent pass-through with
 * zero runtime cost (the worker module is never imported).
 *
 * Server-side requests are intercepted separately via `instrumentation.ts`.
 */
export function MswProvider({ children }: { children: ReactNode }) {
  // When mocking is off, render immediately. When on, wait for the worker.
  const [ready, setReady] = useState(!mockingEnabled);

  useEffect(() => {
    if (!mockingEnabled) return;
    let active = true;
    void import('@/mocks/browser').then(async ({ worker }) => {
      await worker.start({ onUnhandledRequest: 'bypass' });
      if (active) setReady(true);
    });
    return () => {
      active = false;
    };
  }, []);

  if (!ready) return null;
  return children;
}
