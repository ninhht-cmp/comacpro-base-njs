/**
 * Edge/client-safe surface of the authz core: the pure policy (`can`,
 * `isStaff`, `Permission`). The server-only enforcement helpers
 * (`requireStaff`/`requirePermission`) live behind `@/core/authz/require`.
 */
export * from './policy';
