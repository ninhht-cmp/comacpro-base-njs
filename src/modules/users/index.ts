/**
 * Public (client-safe) API of the users feature: the domain model + mappers
 * (`User`, `ReferralUser`, `toUser`, `toReferralUser`). Server helpers (the
 * referral lookup) live behind `@/modules/users/server`.
 *
 * Profile/password editing lives in the mobile app (ADR 0005 / ADR 0006), so
 * this feature has no forms, schemas, or mutation actions.
 */

export * from './api';
