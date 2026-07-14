import { describe, expect, it } from 'vitest';
import { signinSchema, signupSchema } from './index';

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

  it('accepts apostrophe/hyphen names (ethnic-minority names are real names)', () => {
    expect(
      signupSchema.safeParse({
        fullName: "H'Hen Niê",
        username: '0912345678',
        referralCode: 'REF123',
      }).success,
    ).toBe(true);
  });

  it('flags junk fullName input with the per-reason name_* sentinel', () => {
    const cases: Array<[string, string]> = [
      ['%&HGVUJHCVDS_/ Ạ', 'name_invalid_chars'],
      ['Văn A 9', 'name_contains_digits'],
      ['nguyen@gmail.com', 'name_contains_link'],
      ['Chó lừa đảo gọi t', 'name_not_a_name'],
    ];
    for (const [fullName, sentinel] of cases) {
      const result = signupSchema.safeParse({
        fullName,
        username: '0912345678',
        referralCode: 'REF123',
      });
      expect(result.success, fullName).toBe(false);
      if (!result.success) {
        expect(
          result.error.issues.some((i) => i.message === sentinel),
          `${fullName} -> ${sentinel}`,
        ).toBe(true);
      }
    }
  });

  it('normalizes fullName whitespace and unicode form before sending', () => {
    const result = signupSchema.safeParse({
      // Decomposed "ễ" (e + combining circumflex + tilde) + stray
      // whitespace — escapes so no tool can silently precompose it.
      fullName: '  Nguye\u0302\u0303n   V\u0103n A ',
      username: '0912345678',
      referralCode: 'REF123',
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.fullName).toBe('Nguy\u1EC5n V\u0103n A');
    }
  });
});
