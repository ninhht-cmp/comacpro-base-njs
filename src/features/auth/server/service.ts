import type {
  LoginResponseDto,
  RegistrationDto,
  ResetPasswordDto,
  ResetTokenResDto,
  VerifyOtpDto,
} from '@/lib/api/generated/model';
import type { SessionData } from '@/core/session';
import {
  apiRequest,
  jsonPost,
  sessionFromTokens,
} from '@/core/session/identity';

/**
 * NestJS auth-flow endpoints (sign in/up, OTP, password reset, Google). The raw
 * `fetch` transport and session-building live in `@/core/session/identity` —
 * shared with the middleware's token refresh — so this file is just the flows.
 */

// Re-exported so the feature's actions/tests keep importing it from `./service`.
export { AuthError } from '@/core/session/identity';

/** POST /api/v1/auth/signin then GET /me → a full session payload. */
export async function signIn(
  username: string,
  password: string,
): Promise<SessionData> {
  const tokens = await apiRequest<LoginResponseDto>(
    '/auth/signin',
    jsonPost({ username, password }),
  );
  return sessionFromTokens(tokens);
}

/**
 * POST /api/v1/auth/google then GET /me → a full session payload.
 * `idToken` is the Google ID token obtained client-side via Google Sign-In.
 */
export async function googleSignIn(idToken: string): Promise<SessionData> {
  const tokens = await apiRequest<LoginResponseDto>(
    '/auth/google',
    jsonPost({ idToken }),
  );
  return sessionFromTokens(tokens);
}

/** POST /api/v1/auth/signup — creates an account; an OTP is emailed to verify. */
export async function signUp(dto: RegistrationDto): Promise<void> {
  await apiRequest('/auth/signup', jsonPost(dto));
}

/** POST /api/v1/auth/verify-otp — confirms the email after signup. */
export async function verifyOtp(dto: VerifyOtpDto): Promise<void> {
  await apiRequest('/auth/verify-otp', jsonPost(dto));
}

/** POST /api/v1/auth/forgot-password — emails an OTP to reset the password. */
export async function forgotPassword(email: string): Promise<void> {
  await apiRequest('/auth/forgot-password', jsonPost({ email }));
}

/** POST /api/v1/auth/verify-forgot-otp → a short-lived reset token. */
export async function verifyForgotOtp(
  dto: VerifyOtpDto,
): Promise<ResetTokenResDto> {
  return apiRequest<ResetTokenResDto>('/auth/verify-forgot-otp', jsonPost(dto));
}

/** POST /api/v1/auth/reset-password — sets a new password using the reset token. */
export async function resetPassword(dto: ResetPasswordDto): Promise<void> {
  await apiRequest('/auth/reset-password', jsonPost(dto));
}
