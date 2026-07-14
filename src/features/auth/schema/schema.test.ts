import { describe, expect, it } from 'vitest';
import {
  forgotPasswordSchema,
  resetPasswordSchema,
  signinSchema,
  signupSchema,
} from './index';

describe('auth schemas', () => {
  it('accepts valid signin credentials (VN phone username)', () => {
    expect(
      signinSchema.safeParse({ username: '0912345678', password: 'p' }).success,
    ).toBe(true);
    expect(
      signinSchema.safeParse({ username: '+84912345678', password: 'p' })
        .success,
    ).toBe(true);
  });

  it('normalizes phone separators before validating', () => {
    for (const raw of ['090 123 4567', '090.123.4567', '(+84) 90 123 4567']) {
      const result = signinSchema.safeParse({ username: raw, password: 'p' });
      expect(result.success).toBe(true);
      if (result.success) {
        // The action forwards the CANONICAL form to the backend.
        expect(result.data.username).toMatch(/^(\+84|0)901234567$/);
      }
    }
  });

  it('flags a malformed phone with the invalid_phone sentinel', () => {
    const result = signinSchema.safeParse({ username: 'user', password: 'p' });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(
        result.error.issues.some((i) => i.message === 'invalid_phone'),
      ).toBe(true);
    }
  });

  it('requires fullName, phone username and referral code on signup', () => {
    expect(
      signupSchema.safeParse({
        fullName: 'Nguyễn Văn A',
        username: '0912345678',
        referralCode: 'REF123',
      }).success,
    ).toBe(true);
    expect(
      signupSchema.safeParse({
        fullName: 'A',
        username: '0912345678',
        referralCode: '',
      }).success,
    ).toBe(false);
  });

  it('validates the phone on forgot-password', () => {
    expect(
      forgotPasswordSchema.safeParse({ username: '0355555555' }).success,
    ).toBe(true);
    expect(forgotPasswordSchema.safeParse({ username: '012345' }).success).toBe(
      false,
    );
  });

  it('flags a password mismatch with a distinct message', () => {
    const result = resetPasswordSchema.safeParse({
      username: '0912345678',
      otpCode: '123456',
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
