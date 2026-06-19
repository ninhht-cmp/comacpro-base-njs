/**
 * Edge/client-safe surface of the guard core: the pure access-control policy.
 * The server-only helpers (`requireSession`/`requireGuest`) live behind
 * `@/core/guard/require` so they never leak `next/headers` into the edge bundle.
 */
export * from './policy';
