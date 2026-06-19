// Client-safe exports. The server-only prefetch helper lives in `./hydrate`
// and must be imported from there to keep it out of client bundles.
export { getQueryClient, makeQueryClient } from './query-client';
