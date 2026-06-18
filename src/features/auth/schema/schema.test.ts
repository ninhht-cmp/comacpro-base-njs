import { describe, expect, it } from 'vitest';
import { signinSchema, resetPasswordSchema, signupSchema } from './index';

describe('auth schemas', () => {
  it('accepts valid signin credentials', () => {
    expect(
      signinSchema.safeParse({ username: 'u', password: 'p' }).success,
    ).toBe(true);
  });

  it('rejects a blank username', () => {
    expect(
      signinSchema.safeParse({ username: '  ', password: 'p' }).success,
    ).toBe(false);
  });

  it('requires a well-formed email on signup', () => {
    const result = signupSchema.safeParse({
      fullName: 'A',
      username: 'a',
      email: 'not-an-email',
      password: 'p',
    });
    expect(result.success).toBe(false);
  });

  it('flags a password mismatch with a distinct message', () => {
    const result = resetPasswordSchema.safeParse({
      token: 't',
      newPassword: 'a',
      confirmPassword: 'b',
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(
        result.error.issues.some((i) => i.message === 'passwords_mismatch'),
      ).toBe(true);
    }
  });
});
