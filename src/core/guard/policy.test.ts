import { describe, expect, it } from 'vitest';
import { AUTH_PATHS, evaluateGuard, PROTECTED_PATHS } from './policy';

const protectedPath = PROTECTED_PATHS[0];
const authPath = AUTH_PATHS[0];
if (!protectedPath || !authPath) {
  throw new Error('guard policy should derive at least one path per group');
}

describe('evaluateGuard', () => {
  it('redirects an unauthenticated user off a protected route to sign-in', () => {
    expect(evaluateGuard(protectedPath, false)).toEqual({
      type: 'redirect',
      to: '/signin',
    });
  });

  it('allows an authenticated user on a protected route', () => {
    expect(evaluateGuard(protectedPath, true)).toEqual({ type: 'allow' });
  });

  it('matches nested paths under a protected base', () => {
    expect(evaluateGuard(`${protectedPath}/settings`, false)).toEqual({
      type: 'redirect',
      to: '/signin',
    });
  });

  it('redirects a signed-in user off an auth route to the account page', () => {
    expect(evaluateGuard(authPath, true)).toEqual({
      type: 'redirect',
      to: '/account',
    });
  });

  it('allows an unauthenticated user on an auth route', () => {
    expect(evaluateGuard(authPath, false)).toEqual({ type: 'allow' });
  });

  it('allows unguarded routes regardless of auth state', () => {
    expect(evaluateGuard('/', false)).toEqual({ type: 'allow' });
    expect(evaluateGuard('/', true)).toEqual({ type: 'allow' });
  });
});
