import { describe, expect, it } from 'vitest';
import { UserRole } from '@/core/identity';
import { can, isStaff } from './policy';

describe('can', () => {
  it('grants admins and system everything', () => {
    expect(can(UserRole['sm-admin'], 'users.manage')).toBe(true);
    expect(can(UserRole['sm-system'], 'content.manage')).toBe(true);
  });

  it('grants marketing content but not user management', () => {
    expect(can(UserRole['sm-marketing'], 'content.manage')).toBe(true);
    expect(can(UserRole['sm-marketing'], 'users.manage')).toBe(false);
  });

  it('denies field/sales roles any privileged permission', () => {
    expect(can(UserRole['sm-saler'], 'admin.access')).toBe(false);
    expect(can(UserRole['sm-member'], 'content.manage')).toBe(false);
    expect(can(undefined, 'admin.access')).toBe(false);
  });
});

describe('isStaff', () => {
  it('marks back-office roles as staff and field roles as not', () => {
    expect(isStaff(UserRole['sm-admin'])).toBe(true);
    expect(isStaff(UserRole['sm-support-deal'])).toBe(true);
    expect(isStaff(UserRole['sm-boss'])).toBe(false);
    expect(isStaff(UserRole['sm-saler'])).toBe(false);
    expect(isStaff(undefined)).toBe(false);
  });
});
