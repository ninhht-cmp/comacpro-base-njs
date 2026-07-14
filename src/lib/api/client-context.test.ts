import { describe, expect, it } from 'vitest';
import { clientContextHeaders } from './client-context';

describe('clientContextHeaders', () => {
  it('maps the context onto forward headers, skipping absent fields', () => {
    expect(
      clientContextHeaders({
        ip: '1.2.3.4',
        forwardedFor: '1.2.3.4, 10.0.0.1',
        sessionId: 'v-1',
      }),
    ).toEqual({
      // The custom name is the one the backend's ingress can't overwrite.
      'X-Client-IP': '1.2.3.4',
      'X-Real-IP': '1.2.3.4',
      'X-Forwarded-For': '1.2.3.4, 10.0.0.1',
      'X-Client-Session': 'v-1',
    });
    expect(clientContextHeaders(undefined)).toEqual({});
    expect(clientContextHeaders({})).toEqual({});
  });

  it('sanitizes client-supplied values (non-ASCII stripped, length capped)', () => {
    const headers = clientContextHeaders({
      // Emoji/diacritics would make fetch throw on a non-ISO-8859-1 header.
      userAgent: `Mozilla/5.0 🦊 tiếng Việt ${'x'.repeat(600)}`,
    });
    expect(headers['User-Agent']).toContain('Mozilla/5.0');
    expect(headers['User-Agent']).not.toMatch(/[^\x20-\x7E]/);
    expect(headers['User-Agent']!.length).toBeLessThanOrEqual(512);
  });
});
