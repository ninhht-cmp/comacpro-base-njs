import { describe, expect, it } from 'vitest';
import { safeRedirect } from './redirect';

describe('safeRedirect', () => {
  it('allows internal absolute paths', () => {
    expect(safeRedirect('/account')).toBe('/account');
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

  it('rejects normalization bypasses of the prefix checks', () => {
    expect(safeRedirect('/\t/evil.com')).toBeNull(); // tab stripped by URL parser → //evil.com
    expect(safeRedirect('/ /evil.com')).toBeNull(); // whitespace variant
    expect(safeRedirect('/\u0000//evil.com')).toBeNull(); // NUL control char
    expect(safeRedirect('/x/\\evil.com')).toBeNull(); // backslash beyond the prefix
    expect(safeRedirect('/\r\n/evil.com')).toBeNull(); // CRLF
    // Percent-encoded forms are NOT decoded during URL resolution, so this
    // stays an on-origin path and is safe to allow verbatim.
    expect(safeRedirect('/%09/evil.com')).toBe('/%09/evil.com');
  });

  it('rejects non-string input', () => {
    expect(safeRedirect(null)).toBeNull();
    expect(safeRedirect(undefined)).toBeNull();
    expect(safeRedirect(42)).toBeNull();
  });
});
