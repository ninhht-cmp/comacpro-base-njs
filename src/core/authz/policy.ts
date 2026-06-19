import { UserType } from '@/core/identity';

/**
 * Authorization policy — pure and edge-safe. Maps roles to capabilities and
 * encodes the role hierarchy. No I/O, no `next/headers`; unit-testable. Reads
 * (`can`, `hasAtLeast`) are usable in both Server and Client code; the
 * server-side enforcement helpers live in `./require`.
 */

export type Permission =
  | 'admin.access' // reach the admin area at all
  | 'users.manage' // create/update/disable users
  | 'content.manage'; // banners, categories, FAQ, notifications

// super_admin ⊃ admin ⊃ user.
const RANK: Record<UserType, number> = {
  [UserType.SuperAdmin]: 3,
  [UserType.Admin]: 2,
  [UserType.User]: 1,
};

const ROLE_PERMISSIONS: Record<UserType, readonly Permission[]> = {
  [UserType.SuperAdmin]: ['admin.access', 'users.manage', 'content.manage'],
  [UserType.Admin]: ['admin.access', 'content.manage'],
  [UserType.User]: [],
};

/** Whether `role` is at least as privileged as `min` in the hierarchy. */
export function hasAtLeast(role: UserType | undefined, min: UserType): boolean {
  return role !== undefined && RANK[role] >= RANK[min];
}

/** Whether `role` is granted `permission`. */
export function can(
  role: UserType | undefined,
  permission: Permission,
): boolean {
  return role !== undefined && ROLE_PERMISSIONS[role].includes(permission);
}
