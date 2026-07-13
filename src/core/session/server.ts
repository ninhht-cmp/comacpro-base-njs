import 'server-only';

/**
 * Server-only surface of the session core, for Server Components, Route Handlers
 * and Server Actions. Pulls in `next/headers` (via `./cookies`) so it is NOT
 * client-safe. The middleware (`src/proxy.ts`) imports the edge-safe modules
 * (`./session`, `./identity`) directly instead.
 */

export {
  clearSession,
  getAccessToken,
  getSession,
  refreshSessionAndPersist,
  setSession,
  withAuthRetry,
} from './cookies';

export { fetchProfile, refreshSession, refreshTokens } from './identity';

// Single error type for backend API failures (`@/lib/api`), re-exported for
// convenience next to the session helpers whose calls throw it.
export { ApiError } from '@/lib/api/server-fetch';

export type { SessionData, SessionUser } from './session';
