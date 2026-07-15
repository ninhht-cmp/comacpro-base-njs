import type { UserRefResDto } from '@/lib/api/generated/model';
import {
  type ClientContext,
  clientContextHeaders,
} from '@/lib/api/client-context';
import { UserRefResDtoSchema } from '@/lib/api/generated/schemas';
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
  // End-user ip/UA so the backend can rate-limit and spot enumeration scans
  // of this public endpoint. See lib/api/client-context.
  context?: ClientContext,
): Promise<ReferralUser> {
  const query = new URLSearchParams({ sessionId });
  const dto = await serverFetch<UserRefResDto>(
    `/users/referral/${encodeURIComponent(code)}?${query}`,
    // Tight timeout: this lookup gates the signup page's TTFB (the invitee is
    // on mobile, fresh off an invite link). The page fails OPEN on timeout —
    // form renders without the referrer card; submit re-validates — so being
    // aggressive here costs correctness nothing.
    {
      method: 'GET',
      timeoutMs: 3_000,
      headers: clientContextHeaders(context),
      label: 'users:referral',
      schema: UserRefResDtoSchema,
    },
  );
  return toReferralUser(dto);
}

// Profile + password editing (PATCH /users/me, /users/change-password) lived
// here but was never mounted — it belongs to the mobile app (ADR 0005) and
// the backend's `UpdateProfileDto` never matched the parked form. Removed in
// ADR 0006; restore from git history if a web flow is ever needed.
