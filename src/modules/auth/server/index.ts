/**
 * Server-side public API of the auth feature — the sign-in/up server
 * actions. Import from `@/modules/auth/server` in Server Components, Route
 * Handlers and Server Actions. (Password recovery lives in the mobile app —
 * ADR 0005.)
 *
 * Session storage and identity transport now live in the session core
 * (`@/core/session` / `@/core/session/server`), not here — the auth feature only
 * owns its flows.
 */

export type { AuthFormState, SigninState } from './actions';
export { logout, signin, signup } from './actions';
export { readSignupSuccess } from './signup-success';
