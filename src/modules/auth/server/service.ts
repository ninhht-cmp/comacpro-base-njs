import type {
  LoginResponseDto,
  RegistrationDto,
} from '@/lib/api/generated/model';
import type { SessionData } from '@/core/session';
import {
  type ClientContext,
  clientContextHeaders,
} from '@/lib/api/client-context';
import { serverFetch } from '@/lib/api/server-fetch';
import { sessionFromTokens } from '@/core/session/identity';

/**
 * SaleNet auth-flow endpoints (sign in/up). The
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
    label: 'auth:signin',
  });
  return sessionFromTokens(tokens);
}

/**
 * POST /v1/auth/signup — registers by phone + referral code. The backend
 * provisions the account (credential delivery/activation is its concern —
 * SMS/Zalo); there is no public post-signup OTP endpoint.
 */
export async function signUp(
  dto: RegistrationDto,
  // End-user ip/UA/visitor id for the backend's throttling + fraud rules —
  // this call is anonymous AND paid (triggers a ZaloOA send), so it's the
  // one that most needs real client attribution. See lib/api/client-context.
  context?: ClientContext,
): Promise<void> {
  await serverFetch('/auth/signup', {
    method: 'POST',
    json: dto,
    headers: clientContextHeaders(context),
    label: 'auth:signup',
  });
}

// Password recovery deliberately has no web service calls: the mobile app
// owns that flow (ADR 0005). Restore from git history if it ever returns.
