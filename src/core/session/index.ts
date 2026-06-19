/**
 * Client-safe public surface of the session core: types only. Server-only
 * helpers (cookie store, identity transport) live behind `@/core/session/server`;
 * edge-safe primitives (seal/open, refresh) are imported directly from
 * `@/core/session/session` and `@/core/session/identity` by the middleware.
 */
export type { SessionData, SessionUser } from './session';
