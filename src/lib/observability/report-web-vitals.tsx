'use client';

import { useReportWebVitals } from 'next/web-vitals';
import { env } from '@/config/env';

/**
 * Forwards Core Web Vitals (LCP, CLS, INP, …) to the configured RUM endpoint
 * via `navigator.sendBeacon` — non-blocking and survives page unload. No-ops
 * until `NEXT_PUBLIC_VITALS_ENDPOINT` is set, so it's safe to mount everywhere.
 *
 * TODO(observability): point the endpoint at Datadog RUM intake (or a Route
 * Handler that forwards there), and add `@sentry/nextjs` for error tracking —
 * env placeholders (`*_SENTRY_DSN`) already exist. See
 * docs/adr/0001-architecture-and-platform.md.
 */
export function ReportWebVitals() {
  useReportWebVitals((metric) => {
    const endpoint = env.NEXT_PUBLIC_VITALS_ENDPOINT;
    if (endpoint && typeof navigator.sendBeacon === 'function') {
      const body = JSON.stringify({
        name: metric.name,
        value: metric.value,
        rating: metric.rating,
        id: metric.id,
        navigationType: metric.navigationType,
        path: window.location.pathname,
      });
      navigator.sendBeacon(endpoint, body);
    } else if (process.env.NODE_ENV === 'development') {
      console.debug(
        `[web-vitals] ${metric.name}`,
        Math.round(metric.value),
        metric.rating,
      );
    }
  });

  return null;
}
