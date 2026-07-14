# ADR 0006 — Remove web account editing (profile + password)

- **Status:** Accepted
- **Date:** 2026-07-14
- **Relates to:** ADR 0005 (web as marketing + signup funnel)

## Context

The `users` feature carried an editable profile form, a change-password form,
their Server Actions, service calls and zod schemas — but nothing mounted
them. `account/page.tsx` rendered read-only and the code sat behind a
"temporary" comment. Two problems compounded:

- **It contradicts the product decision.** Per ADR 0005 the web surface is the
  marketing + signup funnel; profile and password editing live in the mobile
  app. This is the same class of leftover as the web password-recovery flow
  ADR 0005 already deleted.
- **It was known-broken.** `updateProfile` sent a partial body while SaleNet's
  `UpdateProfileDto` requires `phoneNumber`, `idCardNumber`, `provinceId` …,
  so the backend would reject it. The code would not have worked if mounted.

Unmounted, broken code rots: a new contributor reads the barrel, assumes the
feature ships, and the generated DTOs drift further from the hand-written form.

## Decision

Remove the web account-editing surface, following the ADR 0005 precedent
(delete; git history is the restore path):

- **Deleted:** `modules/users/components/profile-form.tsx`,
  `change-password-form.tsx`, `modules/users/server/actions.ts`,
  `modules/users/schema/`; the `updateProfile` / `changePassword` service
  calls; the barrel exports (`ProfileForm`, `ChangePasswordForm`,
  `UserFormState`, the schemas).
- **Kept:** `fetchReferralUser` (signup page), `toUser` / `toReferralUser`
  mappers and the `User` / `ReferralUser` domain types (account page + signup).
- `account/page.tsx` stays read-only; its comment now points here instead of
  telling readers to "restore" the deleted forms.

## Consequences

- `users` is now a read-only feature: domain model + mappers + one public
  lookup. It has no forms, schemas, or mutation actions — matching its real
  scope on the web.
- The generated `UpdateProfileDto` / `ChangePasswordDto` model types remain in
  `openapi/selection.json` (harmless, unused). Drop them from the selection if
  a future cleanup wants the generated surface to match usage.
- The `Auth.account.profile.*` / `Auth.account.password.*` message keys the
  forms consumed were removed with them (typed keys make this safe — deleting
  a still-used key fails typecheck).
- Restoring a web editing flow means re-adding the forms/actions/schemas AND
  aligning the payload with the full `UpdateProfileDto`.
