// @vitest-environment node
// Server transport — needs Node's fetch/DOMException (jsdom's realm breaks the
// timeout-abort instanceof check).
import { delay, http, HttpResponse } from 'msw';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { server } from '@/mocks/server';
import { ApiError, serverFetch, serverFetchPage } from './server-fetch';

/** SaleNet wraps every response in the BaseResDto envelope. */
function envelope(data: unknown, statusCode = 200) {
  return { success: true, data, messages: 'OK', statusCode };
}

describe('serverFetch', () => {
  it('unwraps the envelope and returns its data', async () => {
    server.use(
      http.get('*/v1/thing', () => HttpResponse.json(envelope({ id: 1 }))),
    );
    await expect(serverFetch('/thing')).resolves.toEqual({ id: 1 });
  });

  it('returns the raw body for a non-enveloped response', async () => {
    server.use(
      http.get('*/v1/raw', () => HttpResponse.json({ hello: 'world' })),
    );
    await expect(serverFetch('/raw')).resolves.toEqual({ hello: 'world' });
  });

  it('treats success:false (even on HTTP 200) as an error, joining the messages', async () => {
    server.use(
      http.post('*/v1/x', () =>
        HttpResponse.json({
          success: false,
          data: null,
          messages: ['first', 'second'],
          statusCode: 409,
        }),
      ),
    );
    await expect(serverFetch('/x', { method: 'POST' })).rejects.toMatchObject({
      name: 'ApiError',
      status: 409,
      message: 'first, second',
    });
  });

  it('extracts a message from the NestJS { message } and { errors[].messages } shapes', async () => {
    server.use(
      http.get('*/v1/e1', () =>
        HttpResponse.json({ message: 'Bad thing' }, { status: 400 }),
      ),
      http.get('*/v1/e2', () =>
        HttpResponse.json(
          { errors: [{ messages: ['x', 'y'] }] },
          { status: 422 },
        ),
      ),
    );
    await expect(serverFetch('/e1')).rejects.toMatchObject({
      status: 400,
      message: 'Bad thing',
    });
    await expect(serverFetch('/e2')).rejects.toMatchObject({
      status: 422,
      message: 'x, y',
    });
  });

  it('sends the bearer token, locale headers and a JSON body', async () => {
    let seen: Record<string, unknown> = {};
    server.use(
      http.post('*/v1/echo', async ({ request }) => {
        seen = {
          auth: request.headers.get('authorization'),
          acceptLang: request.headers.get('accept-language'),
          contentLang: request.headers.get('content-language'),
          contentType: request.headers.get('content-type'),
          body: await request.json(),
        };
        return HttpResponse.json(envelope(null));
      }),
    );
    await serverFetch('/echo', {
      method: 'POST',
      accessToken: 'tok',
      locale: 'vi',
      json: { a: 1 },
    });
    expect(seen).toEqual({
      auth: 'Bearer tok',
      acceptLang: 'vi',
      contentLang: 'vi',
      contentType: 'application/json',
      body: { a: 1 },
    });
  });

  it('maps an upstream timeout to ApiError 504', async () => {
    server.use(
      http.get('*/v1/slow', async () => {
        await delay(60);
        return HttpResponse.json(envelope(null));
      }),
    );
    await expect(serverFetch('/slow', { timeoutMs: 10 })).rejects.toMatchObject(
      {
        name: 'ApiError',
        status: 504,
      },
    );
  });
});

describe('serverFetch observability', () => {
  afterEach(() => vi.restoreAllMocks());

  it('logs a token-redacted cURL repro on failure (never the live token)', async () => {
    const errorLog = vi.spyOn(console, 'error').mockImplementation(() => {});
    server.use(
      http.get('*/v1/boom', () =>
        HttpResponse.json({ message: 'nope' }, { status: 500 }),
      ),
    );
    await expect(
      serverFetch('/boom', { accessToken: 'live-secret-token', label: 'x' }),
    ).rejects.toBeInstanceOf(ApiError);

    const output = errorLog.mock.calls.flat().join('\n');
    expect(output).toContain('✗ 500'); // failure line
    expect(output).toContain('[x]'); // the call label
    expect(output).toContain('curl -X GET'); // repro
    expect(output).not.toContain('live-secret-token'); // redacted
    expect(output).toContain('$TOKEN');
  });
});

describe('serverFetchPage', () => {
  it('returns data plus the pagination sibling from the list envelope', async () => {
    server.use(
      http.get('*/v1/list', () =>
        HttpResponse.json({
          ...envelope([1, 2]),
          pagination: { totalItem: 2, currentPage: 1 },
        }),
      ),
    );
    await expect(serverFetchPage('/list')).resolves.toEqual({
      data: [1, 2],
      pagination: { totalItem: 2, currentPage: 1 },
    });
  });

  it('throws when the response is a bare (non-enveloped) payload', async () => {
    server.use(http.get('*/v1/bare', () => HttpResponse.json([1, 2])));
    await expect(serverFetchPage('/bare')).rejects.toBeInstanceOf(ApiError);
  });
});
