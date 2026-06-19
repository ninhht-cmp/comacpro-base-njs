/**
 * Canonical user-domain enums, shared by the session/authz cores and the users
 * feature. Readable string values replace the API's numeric codes; the
 * `*FromValue` helpers map a raw code (e.g. from the session snapshot) to the
 * enum, leniently (unknown → undefined).
 */

export const UserType = {
  SuperAdmin: 'super_admin',
  Admin: 'admin',
  User: 'user',
} as const;
export type UserType = (typeof UserType)[keyof typeof UserType];

export const UserStatus = {
  Active: 'active',
  Inactive: 'inactive',
  Blocked: 'blocked',
} as const;
export type UserStatus = (typeof UserStatus)[keyof typeof UserStatus];

const USER_TYPE_BY_VALUE: Record<number, UserType> = {
  0: UserType.SuperAdmin,
  1: UserType.Admin,
  2: UserType.User,
};

const USER_STATUS_BY_VALUE: Record<number, UserStatus> = {
  0: UserStatus.Active,
  1: UserStatus.Inactive,
  2: UserStatus.Blocked,
};

export function userTypeFromValue(
  value: number | undefined,
): UserType | undefined {
  return value === undefined ? undefined : USER_TYPE_BY_VALUE[value];
}

export function userStatusFromValue(
  value: number | undefined,
): UserStatus | undefined {
  return value === undefined ? undefined : USER_STATUS_BY_VALUE[value];
}
