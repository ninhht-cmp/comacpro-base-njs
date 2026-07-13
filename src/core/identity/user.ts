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

/**
 * Canonical display grouping of the 13 wire roles: product defines ONE title
 * for all `sm-support-*` variants. UI resolves labels/icons by this key
 * (translations live under `Auth.roles.<key>`); the exhaustive Record keeps
 * the compile-time guarantee — a new backend role must be classified here.
 */
export type RoleKey =
  | 'admin'
  | 'system'
  | 'marketing'
  | 'support'
  | 'boss'
  | 'manager'
  | 'leader'
  | 'saler'
  | 'member';

const ROLE_KEYS: Record<UserRole, RoleKey> = {
  [UserRole['sm-admin']]: 'admin',
  [UserRole['sm-system']]: 'system',
  [UserRole['sm-marketing']]: 'marketing',
  [UserRole['sm-support-user']]: 'support',
  [UserRole['sm-support-supplier']]: 'support',
  [UserRole['sm-support-customer']]: 'support',
  [UserRole['sm-support-deal']]: 'support',
  [UserRole['sm-support-product']]: 'support',
  [UserRole['sm-boss']]: 'boss',
  [UserRole['sm-manager']]: 'manager',
  [UserRole['sm-leader']]: 'leader',
  [UserRole['sm-saler']]: 'saler',
  [UserRole['sm-member']]: 'member',
};

export function roleKeyOf(role: UserRole): RoleKey {
  return ROLE_KEYS[role];
}
