/**
 * Server-side public API of the auth feature — the sign-in/up/OTP/reset/Google
 * server actions. Import from `@/features/auth/server` in Server Components,
 * Route Handlers and Server Actions.
 *
 * Session storage and identity transport now live in the session core
 * (`@/core/session` / `@/core/session/server`), not here — the auth feature only
 * owns its flows.
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
