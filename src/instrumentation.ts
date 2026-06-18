/**
 * Next.js instrumentation hook. Runs once when the server process boots.
 *
 * Starts the MSW node server so server-side requests (RSC fetches, Route
 * Handlers) are mocked too, but only when API mocking is enabled and only in
 * the Node.js runtime (never the edge/proxy runtime).
 */
export async function register() {
  if (
    process.env.NEXT_RUNTIME === 'nodejs' &&
    process.env.NEXT_PUBLIC_API_MOCKING === 'enabled'
  ) {
    const { server } = await import('@/mocks/server');
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
