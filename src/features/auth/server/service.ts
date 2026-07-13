import type {
  ForgotPasswordVerificationDto,
  LoginResponseDto,
  RegistrationDto,
} from '@/lib/api/generated/model';
import type { SessionData } from '@/core/session';
import { serverFetch } from '@/lib/api/server-fetch';
import { sessionFromTokens } from '@/core/session/identity';

/**
 * SaleNet auth-flow endpoints (sign in/up, forgot-password OTP reset). The
 * transport is the shared `serverFetch`; session-building lives in
 * `@/core/session/identity` (shared with the middleware's token refresh), so
 * this file is just the flows.
 *
 * Google sign-in was removed with the SaleNet migration — the API has no
 * `/auth/google`. Restore from git history if the backend ever ships one.
 */

// Re-exported so the feature's actions/tests keep importing it from `./service`.
export { ApiError } from '@/lib/api/server-fetch';

/** POST /v1/auth/signin then GET /users/me → a full session payload. */
export async function signIn(
  username: string,
  password: string,
): Promise<SessionData> {
  const tokens = await serverFetch<LoginResponseDto>('/auth/signin', {
    method: 'POST',
    json: { username, password },
  });
  return sessionFromTokens(tokens);
}

/**
 * POST /v1/auth/signup — registers by phone + referral code. The backend
 * provisions the account (credential delivery/activation is its concern —
 * SMS/Zalo); there is no public post-signup OTP endpoint.
 */
export async function signUp(dto: RegistrationDto): Promise<void> {
  await serverFetch('/auth/signup', { method: 'POST', json: dto });
}

/** POST /v1/auth/forgot-password — sends an OTP to the account's phone. */
export async function forgotPassword(username: string): Promise<void> {
  await serverFetch('/auth/forgot-password', {
    method: 'POST',
    json: { username },
  });
}

/** POST /v1/auth/forgot-password/resend-otp — resends the reset OTP. */
export async function resendForgotOtp(username: string): Promise<void> {
  await serverFetch('/auth/forgot-password/resend-otp', {
    method: 'POST',
    json: { username },
  });
}

/**
 * POST /v1/auth/forgot-password/verify — one-shot: verifies the OTP AND sets
 * the new password.
 */
export async function verifyForgotPassword(
  dto: ForgotPasswordVerificationDto,
): Promise<void> {
  await serverFetch('/auth/forgot-password/verify', {
    method: 'POST',
    json: dto,
  });
}
