import {
  ProfileMeResDtoRole,
  UserRefResDtoStatus,
} from '@/lib/api/generated/model';

/**
 * Canonical user-domain enums, shared by the session/authz cores and the users
 * feature. SaleNet already uses readable string values (`sm-admin`, `active`),
 * so the domain types re-export the GENERATED unions instead of duplicating
 * them: when the backend adds a role, the generated union widens and every
 * exhaustive `Record<UserRole, …>` (authz policy, labels) fails to compile —
 * the same drift guarantee the old numeric mappers provided.
 */

export const UserRole = ProfileMeResDtoRole;
export type UserRole = ProfileMeResDtoRole;

export const UserStatus = UserRefResDtoStatus;
export type UserStatus = UserRefResDtoStatus;

const ALL_ROLES = new Set<string>(Object.values(UserRole));
const ALL_STATUSES = new Set<string>(Object.values(UserStatus));

/** Validate a raw wire/session value into a role, leniently (unknown → undefined). */
export function roleFromValue(value: string | undefined): UserRole | undefined {
  return value !== undefined && ALL_ROLES.has(value)
    ? (value as UserRole)
    : undefined;
}

/** Validate a raw wire/session value into a status, leniently (unknown → undefined). */
export function statusFromValue(
  value: string | undefined,
): UserStatus | undefined {
  return value !== undefined && ALL_STATUSES.has(value)
    ? (value as UserStatus)
    : undefined;
}
