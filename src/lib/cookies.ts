import { env } from '@/config/env';

/**
 * First-party cookie factory. Every app cookie shares the same security
 * options — only the name and lifetime differ — so they are defined here once
 * instead of being hand-rolled at each call site (session, visitor, signup).
 *
 * `__Host-` in production locks the cookie to this exact host over HTTPS with
 * no `Domain` attribute, so a subdomain can never plant/fixate it. The prefix
 * requires `secure`, which localhost dev over http can't satisfy — hence the
 * bare name outside production.
 *
 * Edge-safe (imports only `env`) so `src/proxy.ts` and the edge-safe session
 * primitives can use the results.
 */
export function defineCookie(baseName: string, maxAgeSeconds: number) {
  const secure = env.NODE_ENV === 'production';
  return {
    name: secure ? `__Host-${baseName}` : baseName,
    options: {
      httpOnly: true,
      sameSite: 'lax' as const,
      secure,
      path: '/',
      maxAge: maxAgeSeconds,
    },
  };
}
