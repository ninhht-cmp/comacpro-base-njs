import { env } from '@/config/env';

/**
 * Client-side instrumentation (Next.js `instrumentation-client` convention —
 * runs before the app hydrates). Sentry is loaded DYNAMICALLY and only when
 * the DSN is configured, so unconfigured environments ship zero SDK bytes to
 * the browser. Errors-only (no tracing/replay) to keep bundle and quota lean.
 *
 * Trade-off of the lazy import: errors thrown in the first ~hundred ms before
 * the chunk loads are missed. Acceptable — the server side (instrumentation.ts
 * `onRequestError`) catches everything render-critical.
 */
if (env.NEXT_PUBLIC_SENTRY_DSN) {
  void import('@sentry/nextjs').then((Sentry) => {
    Sentry.init({
      dsn: env.NEXT_PUBLIC_SENTRY_DSN,
      environment: process.env.NODE_ENV,
      tracesSampleRate: 0,
    });
  });
}
