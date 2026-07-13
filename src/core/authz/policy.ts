import { UserRole } from '@/core/identity';

/**
 * Authorization policy — pure and edge-safe. Maps SaleNet roles to
 * capabilities. No I/O, no `next/headers`; unit-testable. Reads (`can`,
 * `isStaff`) are usable in both Server and Client code; the server-side
 * enforcement helpers live in `./require`.
 *
 * ⚠️ PRODUCT TODO: the permission grid below is a conservative first cut
 * (back-office staff get admin access, field/sales roles get nothing)
 * inferred from role names — confirm against SaleNet's real authorization
 * matrix before building admin features on top of it.
 */

export type Permission =
  | 'admin.access' // reach the admin area at all
  | 'users.manage' // create/update/disable users
  | 'content.manage'; // notifications, catalogs, …

/**
 * Exhaustive by construction: `Record<UserRole, …>` means a new backend role
 * fails compilation here instead of silently getting default permissions.
 */
const ROLE_PERMISSIONS: Record<UserRole, readonly Permission[]> = {
  [UserRole['sm-admin']]: ['admin.access', 'users.manage', 'content.manage'],
  [UserRole['sm-system']]: ['admin.access', 'users.manage', 'content.manage'],
  [UserRole['sm-marketing']]: ['admin.access', 'content.manage'],
  [UserRole['sm-support-user']]: ['admin.access', 'users.manage'],
  [UserRole['sm-support-supplier']]: ['admin.access'],
  [UserRole['sm-support-customer']]: ['admin.access'],
  [UserRole['sm-support-deal']]: ['admin.access'],
  [UserRole['sm-support-product']]: ['admin.access', 'content.manage'],
  [UserRole['sm-boss']]: [],
  [UserRole['sm-manager']]: [],
  [UserRole['sm-leader']]: [],
  [UserRole['sm-saler']]: [],
  [UserRole['sm-member']]: [],
};

/** Back-office staff roles (any role granted `admin.access`). */
export function isStaff(role: UserRole | undefined): boolean {
  return can(role, 'admin.access');
}

/** Whether `role` is granted `permission`. */
export function can(
  role: UserRole | undefined,
  permission: Permission,
): boolean {
  return role !== undefined && ROLE_PERMISSIONS[role].includes(permission);
}
