# ADR 0003 — Migrate to the SaleNet backend (BE SM Service)

- **Status:** Accepted
- **Date:** 2026-07-13
- **Relates to:** ADR 0002 (RSC-first data layer)

## Context

The template originally targeted a NestJS backend whose live API deviated
from its OpenAPI spec (top-level payloads vs a declared `BaseResDto`
envelope) — the reason ADR 0002 retired the generated client. The project now
targets **SaleNet** (`https://api.dev.salenet.vn`, spec at `/docs-json`),
which was probed against its spec before adoption: **the live API honors the
`BaseResDto` envelope on both success and error paths**, the spec is
duplicate-free, and role/status enums are readable strings.

## Decision

Adopt SaleNet as the template's backend. Concretely:

- **Transport**: `serverFetch` targets `/v1` and **unwraps the envelope**
  (`{ success, data, messages, statusCode }`), throwing `ApiError` from
  `messages` on failure. List endpoints carry `pagination` beside `data`;
  `serverFetchPage` preserves it.
- **Codegen**: `openapi/openapi.json` is a committed snapshot of the SaleNet
  spec; generation is filtered to the tags in use (`Auth`, `Users`,
  `Notifications`) — widen as features are migrated. A transformer
  (`scripts/openapi-input-transformer.mjs`) strips known spec defects (empty
  `enum: []`). `clean` stays OFF: orval wipes output before resolving input,
  so an unreachable spec URL would destroy committed models.
- **Identity**: user ids are UUID strings; roles are the 13 `sm-*` strings.
  `core/identity` re-exports the generated unions (same compile-time drift
  guarantee as the old numeric mappers); the authz grid in
  `core/authz/policy.ts` is a conservative first cut pending the real matrix.
- **Auth flows** (SaleNet reality):
  - Sign-in: username IS a VN phone number (backend regex mirrored in zod).
  - Sign-up: `fullName + username(phone) + referralCode`; credentials are
    delivered out-of-band — no public post-signup OTP step, so the old
    `/verify-otp` page is gone.
  - Password reset: 2 steps — `/forgot-password` (phone) then
    `/reset-password` (OTP + new password in ONE verify call), with resend.
    The old 3-step token flow is gone.
  - **Removed: Google sign-in** (no `/auth/google` on SaleNet). Restore from
    git history if the backend ships one.
- **Referral / invite-only signup**: `GET /v1/users/referral/{code}` is wired
  end-to-end. The mobile app's invite links are `/signup?referral=<phone>` —
  the referral code IS the referrer's phone number (verified against the live
  API). There is **no visible referral input**: the code travels as a hidden
  field, and the signup page resolves it server-side into four states —
  resolved (form + "invited by" card), invalid/inactive (fail FAST: form
  blocked in place with guidance, no redirect), missing (invite-required
  explainer), transient lookup failure (fail OPEN: form without the card,
  backend re-validates on submit). A `next.config.ts` redirect maps the bare
  `/signup` (vi is unprefixed and localizes to `/dang-ky`) so app links
  don't 404. The lookup's REQUIRED `sessionId` query param (invite-open
  attribution; the app sends its device session) is satisfied by an anonymous
  visitor-id cookie minted in `proxy.ts` on the signup path only
  (`src/lib/visitor.ts`) — the dev backend doesn't enforce it yet, but the
  contract says required, so web honors it.

## Known gaps (backend asks)

- No `/auth/logout` — refresh tokens can't be revoked; logout is local-only.
- No self-service account deletion — the account page's delete action
  reports "unavailable".
- `UpdateProfileDto` requires fields (idCardNumber, provinceId, …) the
  profile form doesn't collect yet; the form may 400 with the backend's
  message until the profile feature is fully migrated.
- Spec defects reported upstream: empty `enum: []` on
  `ProductDetail*ResDto.manufactureYear/usedTime`; the referral endpoint
  returns `statusCode: "active"` (the user's status string, not a number) in
  its envelope — `serverFetch` tolerates it, but the envelope contract is
  violated.
- **Notification localization is unconfirmed**: the spec declares no
  localization header on any endpoint. We send both `Accept-Language`
  (standard) and `Content-Language` (previous backend's convention) —
  backend team to confirm whether `NotificationResDto.description` is
  localized per-request and by which header.
- `RegistrationDto` has no `sessionId` field, so invite-open attribution
  (the referral lookup's required `sessionId`) can't be joined to the
  eventual signup from web. If attribution is the goal, add an optional
  `sessionId` to signup — the web visitor cookie is already in place.

## Consequences

- MSW handlers and tests are envelope-accurate; keep them that way or they
  pass where the real API fails.
- `.env` must point `API_BASE_URL`/`NEXT_PUBLIC_API_BASE_URL` at SaleNet and
  `OPENAPI_SPEC` at `https://api.dev.salenet.vn/docs-json`.
- With a spec the live API actually honors, re-introducing generated
  client/hooks (per ADR 0002's re-entry condition) becomes viable the moment
  a feature needs client-side data behavior.
