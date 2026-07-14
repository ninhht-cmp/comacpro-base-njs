// @vitest-environment node
import { afterEach, describe, expect, it, vi } from 'vitest';
import { logger } from './logger';

// vitest.config sets NODE_ENV via the test runner; these assertions target the
// dev-mode branch (readable lines), which is what the test env resolves to.
afterEach(() => vi.restoreAllMocks());

describe('logger (development formatting)', () => {
  it('prefixes with the scope and routes levels to the matching console method', () => {
    const info = vi.spyOn(console, 'info').mockImplementation(() => {});
    const error = vi.spyOn(console, 'error').mockImplementation(() => {});

    logger.info('api', 'hello');
    logger.error('session', 'boom');

    expect(info).toHaveBeenCalledWith('[api] hello');
    expect(error).toHaveBeenCalledWith('[session] boom');
  });

  it('normalizes an Error payload to message + stack instead of an opaque object', () => {
    const error = vi.spyOn(console, 'error').mockImplementation(() => {});
    logger.error('auth', 'failed', new Error('nope'));
    expect(error).toHaveBeenCalledWith(
      '[auth] failed',
      expect.objectContaining({ error: 'nope', stack: expect.any(String) }),
    );
  });
});
