/**
 * Server-side public API of the auth feature. Import from `@/features/auth/server`
 * in Server Components, Route Handlers and Server Actions.
 *
 * This barrel pulls in `next/headers` (via `./cookies`) and is therefore NOT
 * client-safe — client components must import the server *actions* directly
 * (they carry their own `'use server'` boundary). `proxy.ts` (middleware tier,
 * no `next/headers`) imports `./session` and `./service` directly instead.
 */

export type { AuthFormState, SigninState } from './actions';
export {
  forgotPassword,
  logout,
  resetPassword,
  signin,
  signinWithGoogle,
  signup,
  verifyForgotOtp,
  verifyOtp,
} from './actions';

export {
  authorizedRequest,
  clearSession,
  getAccessToken,
  getSession,
  setSession,
} from './cookies';

export { AuthError, fetchProfile, refreshTokens } from './service';

export type { SessionData, SessionUser } from './session';
