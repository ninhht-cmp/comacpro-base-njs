/**
 * Next.js instrumentation hook. Runs once when the server process boots.
 *
 * Starts the MSW node server so server-side requests (RSC fetches, Route
 * Handlers) are mocked, only in the Node.js runtime (never the edge/proxy
 * runtime). Two modes:
 *   `enabled`   — every handled endpoint is mocked (no backend needed).
 *   `paid-only` — ONLY the endpoints whose real invocation costs money
 *                 (ZaloOA/SMS sends: signup, forgot-password OTP) are mocked;
 *                 everything else hits the live API. Unhandled requests
 *                 bypass to the network in both modes.
 */
export async function register() {
  const mocking = process.env.NEXT_PUBLIC_API_MOCKING;
  if (
    process.env.NEXT_RUNTIME === 'nodejs' &&
    (mocking === 'enabled' || mocking === 'paid-only')
  ) {
    const { setupServer } = await import('msw/node');
    const { handlers, paidEndpointHandlers } = await import('@/mocks/handlers');
    const server = setupServer(
      ...(mocking === 'paid-only' ? paidEndpointHandlers : handlers),
    );
    server.listen({ onUnhandledRequest: 'bypass' });
  }

  // Sentry (server + edge — `register` runs once per runtime and the SDK
  // resolves the right build). Gated on the DSN so unconfigured envs stay a
  // no-op with zero SDK cost. Errors-only on purpose: tracing/replay stay
  // off until there's a decided budget for them.
  if (process.env.SENTRY_DSN) {
    const Sentry = await import('@sentry/nextjs');
    Sentry.init({
      dsn: process.env.SENTRY_DSN,
      environment: process.env.NODE_ENV,
      tracesSampleRate: 0,
    });
  }
}

/**
 * Server-side error hook (Next.js `onRequestError`). Fires for uncaught errors
 * in Server Components, Route Handlers, Server Actions and middleware. Logs a
 * structured line now; forward to Sentry/Datadog once the SDK is wired in.
 */
export async function onRequestError(
  error: unknown,
  request: {
    path: string;
    method: string;
    headers: Record<string, string | string[] | undefined>;
  },
  context: { routerKind: string; routePath: string; renderSource?: string },
): Promise<void> {
  // Structured so log pipelines (Datadog) can parse and alert on it.
  console.error(
    JSON.stringify({
      level: 'error',
      kind: 'request_error',
      message: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
      method: request.method,
      path: request.path,
      routerKind: context.routerKind,
      routePath: context.routePath,
    }),
  );

  if (process.env.SENTRY_DSN) {
    const Sentry = await import('@sentry/nextjs');
    // Param shapes mirror Next's official hook types; the SDK's own
    // signature is narrower than ours, hence the casts.
    Sentry.captureRequestError(
      error,
      request as Parameters<typeof Sentry.captureRequestError>[1],
      context as Parameters<typeof Sentry.captureRequestError>[2],
    );
  }
}
