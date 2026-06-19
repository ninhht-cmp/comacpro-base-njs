import { describe, expect, it } from 'vitest';
import { UserType } from '@/core/identity';
import { can, hasAtLeast } from './policy';

describe('hasAtLeast', () => {
  it('honors the role hierarchy', () => {
    expect(hasAtLeast(UserType.SuperAdmin, UserType.Admin)).toBe(true);
    expect(hasAtLeast(UserType.Admin, UserType.Admin)).toBe(true);
    expect(hasAtLeast(UserType.User, UserType.Admin)).toBe(false);
  });

  it('treats an unknown role as unprivileged', () => {
    expect(hasAtLeast(undefined, UserType.User)).toBe(false);
  });
});

describe('can', () => {
  it('grants admins content management but not user management', () => {
    expect(can(UserType.Admin, 'content.manage')).toBe(true);
    expect(can(UserType.Admin, 'admin.access')).toBe(true);
    expect(can(UserType.Admin, 'users.manage')).toBe(false);
  });

  it('grants super admins everything', () => {
    expect(can(UserType.SuperAdmin, 'users.manage')).toBe(true);
  });

  it('denies regular users any privileged permission', () => {
    expect(can(UserType.User, 'admin.access')).toBe(false);
    expect(can(undefined, 'admin.access')).toBe(false);
  });
});
