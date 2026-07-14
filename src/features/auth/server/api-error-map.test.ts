import { describe, expect, it, vi } from 'vitest';
import { stateFromApiError } from './api-error-map';
import { ApiError } from './service';

// Echo the key — asserting on keys keeps the test independent of copy edits.
const t = (key: string) => key;

describe('stateFromApiError', () => {
  it('pins "User already exists" to the username field', () => {
    expect(
      stateFromApiError(new ApiError('User already exists', 400), t, 'signup'),
    ).toEqual({
      fieldErrors: { username: 'errors.user_exists' },
    });
  });

  it('pins the missing-Zalo rejection to the username field', () => {
    expect(
      stateFromApiError(
        new ApiError('Phone number does not have a Zalo account', 400),
        t,
        'signup',
      ),
    ).toEqual({ fieldErrors: { username: 'errors.no_zalo_account' } });
  });

  it('maps referral rejections to the referralCode field on signup', () => {
    for (const text of [
      'Invalid referral code',
      // The referrer's account is gone — same remedy as a bad code.
      'User not found',
    ]) {
      expect(stateFromApiError(new ApiError(text, 400), t, 'signup')).toEqual({
        fieldErrors: { referralCode: 'errors.invalid_referral' },
      });
    }
    expect(
      stateFromApiError(
        new ApiError('Cannot register with admin referral code', 400),
        t,
        'signup',
      ),
    ).toEqual({ fieldErrors: { referralCode: 'errors.admin_referral' } });
  });

  it('does NOT apply signup-scoped rules to other flows', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    // "User not found" outside signup means the visitor's own account — an
    // unmapped rejection until the backend's text per flow is confirmed.
    expect(
      stateFromApiError(
        new ApiError('User not found', 400),
        t,
        'forgot-password',
      ),
    ).toEqual({ error: 'errors.unknown' });
    expect(warn).toHaveBeenCalledOnce();
    warn.mockRestore();
  });

  it('maps the NestJS throttler rejection as a form-level error in any flow', () => {
    expect(
      stateFromApiError(
        new ApiError('ThrottlerException: Too Many Requests', 429),
        t,
        'signin',
      ),
    ).toEqual({ error: 'errors.too_many_requests' });
  });

  it('falls back to the generic message for 5xx and unknown failures', () => {
    expect(
      stateFromApiError(
        new ApiError('Internal server error!', 500),
        t,
        'signup',
      ),
    ).toEqual({ error: 'errors.unknown' });
    expect(stateFromApiError(new Error('boom'), t, 'signup')).toEqual({
      error: 'errors.unknown',
    });
  });
});
