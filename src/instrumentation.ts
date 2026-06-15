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
}
