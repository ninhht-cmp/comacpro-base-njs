import {
  dehydrate,
  HydrationBoundary,
  type QueryClient,
} from '@tanstack/react-query';
import type { ReactNode } from 'react';
import { makeQueryClient } from './query-client';

/**
 * Server Component that prefetches into a fresh request-scoped `QueryClient`
 * and streams the dehydrated cache to the client, where it hydrates into the
 * browser client. Pass a `prefetch` callback and call `prefetchQuery` with the
 * orval-generated query options — generics are inferred per call.
 *
 * ```tsx
 * <HydrateQuery
 *   prefetch={(qc) => qc.prefetchQuery(getListProductsQueryOptions())}
 * >
 *   <ProductList />
 * </HydrateQuery>
 * ```
 *
 * For several queries, await them together inside the callback:
 * `prefetch={(qc) => Promise.all([qc.prefetchQuery(a), qc.prefetchQuery(b)])}`.
 */
export async function HydrateQuery({
  prefetch,
  children,
}: {
  prefetch?: (queryClient: QueryClient) => Promise<unknown> | void;
  children: ReactNode;
}) {
  const queryClient = makeQueryClient();
  await prefetch?.(queryClient);

  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      {children}
    </HydrationBoundary>
  );
}
