/**
 * Edge/client-safe surface of the authz core: the pure policy (`can`,
 * `hasAtLeast`, `Permission`). The server-only enforcement helpers
 * (`requireRole`/`requirePermission`) live behind `@/core/authz/require`.
 */
export * from './policy';
