'use client';

import { QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import type { ReactNode } from 'react';
import { getQueryClient } from '@/lib/query-client';

/**
 * Supplies the TanStack Query client to the tree. On the server this resolves
 * to a fresh per-request client; in the browser, the shared singleton — so
 * server-prefetched, dehydrated state hydrates into the same client.
 *
 * `ReactQueryDevtools` ships nothing in production builds.
 */
export function QueryProvider({ children }: { children: ReactNode }) {
  const queryClient = getQueryClient();

  return (
    <QueryClientProvider client={queryClient}>
      {children}
      <ReactQueryDevtools initialIsOpen={false} />
    </QueryClientProvider>
  );
}
