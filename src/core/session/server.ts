import 'server-only';

/**
 * Server-only surface of the session core, for Server Components, Route Handlers
 * and Server Actions. Pulls in `next/headers` (via `./cookies`) so it is NOT
 * client-safe. The middleware (`src/proxy.ts`) imports the edge-safe modules
 * (`./session`, `./identity`) directly instead.
 */

export {
  authorizedRequest,
  clearSession,
  getAccessToken,
  getSession,
  setSession,
} from './cookies';

export { AuthError, fetchProfile, refreshTokens } from './identity';

export type { SessionData, SessionUser } from './session';
