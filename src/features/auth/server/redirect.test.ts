import { describe, expect, it } from 'vitest';
import { safeRedirect } from './redirect';

describe('safeRedirect', () => {
  it('allows internal absolute paths', () => {
    expect(safeRedirect('/tai-khoan')).toBe('/tai-khoan');
    expect(safeRedirect('/en/account')).toBe('/en/account');
    expect(safeRedirect('/account?tab=orders')).toBe('/account?tab=orders');
  });

  it('rejects off-site and malformed targets', () => {
    expect(safeRedirect('https://evil.com')).toBeNull(); // absolute URL
    expect(safeRedirect('//evil.com')).toBeNull(); // protocol-relative
    expect(safeRedirect('/\\evil.com')).toBeNull(); // backslash trick
    expect(safeRedirect('account')).toBeNull(); // not absolute
    expect(safeRedirect('')).toBeNull();
  });

  it('rejects non-string input', () => {
    expect(safeRedirect(null)).toBeNull();
    expect(safeRedirect(undefined)).toBeNull();
    expect(safeRedirect(42)).toBeNull();
  });
});
