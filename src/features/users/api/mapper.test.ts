import { describe, expect, it } from 'vitest';
import { toUser } from './mapper';
import { UserStatus, UserType } from './types';

describe('toUser', () => {
  it('maps the backend numeric enums to readable domain enums', () => {
    const user = toUser({
      id: 1,
      fullName: 'Ada',
      email: 'ada@cmp.com',
      type: 1, // ADMIN
      status: 0, // ACTIVE
    });

    expect(user.type).toBe(UserType.Admin);
    expect(user.status).toBe(UserStatus.Active);
    expect(user.fullName).toBe('Ada');
  });

  it('leaves optional enum fields undefined when the DTO omits them', () => {
    const user = toUser({ id: 2, username: 'bob' });

    expect(user.type).toBeUndefined();
    expect(user.status).toBeUndefined();
    expect(user.username).toBe('bob');
  });

  it('maps every role and status value', () => {
    expect(toUser({ id: 3, type: 0 }).type).toBe(UserType.SuperAdmin);
    expect(toUser({ id: 4, type: 2 }).type).toBe(UserType.User);
    expect(toUser({ id: 5, status: 2 }).status).toBe(UserStatus.Blocked);
  });
});
