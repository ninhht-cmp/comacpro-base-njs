import { describe, expect, it } from 'vitest';
import { buildCurl } from './debug';

describe('buildCurl', () => {
  it('builds a runnable curl with method, url, headers and JSON body', () => {
    const curl = buildCurl(
      'post',
      'http://api.test/v1/auth/signin',
      { 'Content-Type': 'application/json' },
      { username: '0912345678' },
    );
    expect(curl).toContain("curl -X POST 'http://api.test/v1/auth/signin'");
    expect(curl).toContain("-H 'Content-Type: application/json'");
    expect(curl).toContain(`-d '{"username":"0912345678"}'`);
  });

  it('REDACTS the bearer token — a live credential must never reach the logs', () => {
    const curl = buildCurl('get', 'http://api.test/v1/users/me', {
      Authorization: 'Bearer super-secret-access-token',
    });
    expect(curl).not.toContain('super-secret-access-token');
    expect(curl).toContain('Bearer $TOKEN');
  });

  it('omits the body flag when there is no JSON payload', () => {
    const curl = buildCurl('get', 'http://api.test/v1/x', {});
    expect(curl).not.toContain('-d');
  });
});
