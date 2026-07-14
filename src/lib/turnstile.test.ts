import { http, HttpResponse } from 'msw';
import { describe, expect, it } from 'vitest';
import { server } from '@/mocks/server';
import { verifyTurnstile } from './turnstile';

const VERIFY_URL = 'https://challenges.cloudflare.com/turnstile/v0/siteverify';

describe('verifyTurnstile', () => {
  it('accepts a token Cloudflare confirms, forwarding token and ip', async () => {
    let receivedBody: string | undefined;
    server.use(
      http.post(VERIFY_URL, async ({ request }) => {
        receivedBody = await request.text();
        return HttpResponse.json({ success: true });
      }),
    );
    await expect(verifyTurnstile('tok-1', '1.2.3.4', 'secret-x')).resolves.toBe(
      'ok',
    );
    const params = new URLSearchParams(receivedBody);
    expect(params.get('secret')).toBe('secret-x');
    expect(params.get('response')).toBe('tok-1');
    expect(params.get('remoteip')).toBe('1.2.3.4');
  });

  it('rejects when Cloudflare says the token is bad', async () => {
    server.use(
      http.post(VERIFY_URL, () => HttpResponse.json({ success: false })),
    );
    await expect(verifyTurnstile('tok-1', undefined, 'secret-x')).resolves.toBe(
      'rejected',
    );
  });

  it('rejects a missing token without calling Cloudflare', async () => {
    await expect(
      verifyTurnstile(undefined, undefined, 'secret-x'),
    ).resolves.toBe('rejected');
  });

  it('fails OPEN when the verify service errors or is unreachable', async () => {
    server.use(
      http.post(VERIFY_URL, () => new HttpResponse(null, { status: 500 })),
    );
    await expect(verifyTurnstile('tok-1', undefined, 'secret-x')).resolves.toBe(
      'unavailable',
    );

    server.use(http.post(VERIFY_URL, () => HttpResponse.error()));
    await expect(verifyTurnstile('tok-1', undefined, 'secret-x')).resolves.toBe(
      'unavailable',
    );
  });

  it('reports unavailable when no secret is configured', async () => {
    await expect(verifyTurnstile('tok-1', undefined, undefined)).resolves.toBe(
      'unavailable',
    );
  });
});
