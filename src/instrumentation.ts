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

  // TODO(observability): initialise the Sentry/OpenTelemetry SDK here, e.g.
  //   if (process.env.NEXT_RUNTIME === 'nodejs') await import('./sentry.server');
  //   if (process.env.NEXT_RUNTIME === 'edge')   await import('./sentry.edge');
  // Gated on SENTRY_DSN so unconfigured envs stay a no-op.
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

  // TODO(observability): Sentry.captureRequestError(error, request, context);
}
