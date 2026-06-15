import {
  defaultShouldDehydrateQuery,
  isServer,
  QueryClient,
} from '@tanstack/react-query';
import { ApiError } from '@/lib/fetcher/orval-client';

/**
 * Creates a fresh {@link QueryClient}. On the server we make a new one per
 * request; in the browser we keep a singleton (see {@link getQueryClient}).
 */
export function makeQueryClient(): QueryClient {
  return new QueryClient({
    defaultOptions: {
      queries: {
        // Server data is fresh for a minute before a background refetch.
        staleTime: 60_000,
        retry: (failureCount, error) => {
          // Never retry on client errors (4xx) — they won't fix themselves.
          if (error instanceof ApiError && error.status < 500) return false;
          return failureCount < 2;
        },
      },
      dehydrate: {
        // Also dehydrate still-pending queries so server-prefetched data can
        // stream to the client (Next.js App Router streaming + Suspense).
        shouldDehydrateQuery: (query) =>
          defaultShouldDehydrateQuery(query) ||
          query.state.status === 'pending',
      },
    },
  });
}

let browserQueryClient: QueryClient | undefined;

/**
 * Returns the request-scoped client on the server, or the shared browser
 * singleton on the client. Always call this rather than `new QueryClient()`.
 */
export function getQueryClient(): QueryClient {
  if (isServer) return makeQueryClient();
  return (browserQueryClient ??= makeQueryClient());
}
