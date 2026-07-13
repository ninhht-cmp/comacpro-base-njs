import type {
  ChangePasswordDto,
  UpdateProfileDto,
  UserRefResDto,
} from '@/lib/api/generated/model';
import { serverFetch } from '@/lib/api/server-fetch';
import { type ReferralUser, toReferralUser } from '../api';

/**
 * SaleNet `users` endpoints via the shared `serverFetch` transport. Each
 * authenticated call takes the caller's session bearer `accessToken`
 * explicitly (the transport stays free of `next/headers`, so the middleware
 * can share it).
 */

// Re-exported so the feature's actions keep importing it from `./service`.
export { ApiError } from '@/lib/api/server-fetch';

/**
 * GET /v1/users/referral/{code} — public lookup of the referrer behind a
 * referral code (shown on the signup page so the invitee can confirm who
 * invited them). No bearer token needed.
 *
 * `sessionId` is a REQUIRED query param per the spec: the backend uses it to
 * attribute/deduplicate invite-link opens (the mobile app sends its device
 * session). Web sends the anonymous visitor id — see `src/lib/visitor.ts`.
 */
export async function fetchReferralUser(
  code: string,
  sessionId: string,
): Promise<ReferralUser> {
  const query = new URLSearchParams({ sessionId });
  const dto = await serverFetch<UserRefResDto>(
    `/users/referral/${encodeURIComponent(code)}?${query}`,
    // Tight timeout: this lookup gates the signup page's TTFB (the invitee is
    // on mobile, fresh off an invite link). The page fails OPEN on timeout —
    // form renders without the referrer card; submit re-validates — so being
    // aggressive here costs correctness nothing.
    { method: 'GET', timeoutMs: 3_000 },
  );
  return toReferralUser(dto);
}

/**
 * PATCH /v1/users/me — update the signed-in user's profile.
 *
 * ⚠️ PARKED: SaleNet's `UpdateProfileDto` requires `phoneNumber`,
 * `idCardNumber`, `provinceId` … which the current profile form doesn't
 * collect, so the backend may reject the partial payload (its message is
 * surfaced inline by the form). Extend the form to the full DTO when the
 * profile feature is properly migrated.
 */
export async function updateProfile(
  accessToken: string,
  dto: Partial<UpdateProfileDto>,
): Promise<void> {
  await serverFetch('/users/me', { method: 'PATCH', json: dto, accessToken });
}

/** PATCH /v1/users/change-password — change the signed-in user's password. */
export async function changePassword(
  accessToken: string,
  dto: ChangePasswordDto,
): Promise<void> {
  await serverFetch('/users/change-password', {
    method: 'PATCH',
    json: dto,
    accessToken,
  });
}
