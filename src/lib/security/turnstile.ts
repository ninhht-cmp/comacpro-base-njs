import { env } from '@/config/env';

/**
 * Cloudflare Turnstile server-side verification (anti-bot on signup — the
 * submit triggers a PAID ZaloOA send, so an unprotected form is a free
 * message cannon; ADR 0004). The whole feature is opt-in: with either key
 * unset, `turnstileEnabled()` is false, the widget renders nothing
 * (`src/components/form/turnstile.tsx`) and actions skip verification —
 * dev/e2e run unchanged.
 *
 * Failure policy: a missing/invalid token is REJECTED (that's the point),
 * but a Cloudflare outage fails OPEN — blocking every signup because the
 * challenge service is down costs more than letting a bot burst through.
 */

/** Form field the widget injects its token into (Turnstile's default name). */
export const TURNSTILE_FIELD = 'cf-turnstile-response';

const VERIFY_URL = 'https://challenges.cloudflare.com/turnstile/v0/siteverify';

export function turnstileEnabled(): boolean {
  return Boolean(
    env.TURNSTILE_SECRET_KEY && env.NEXT_PUBLIC_TURNSTILE_SITE_KEY,
  );
}

export type TurnstileVerdict = 'ok' | 'rejected' | 'unavailable';

export async function verifyTurnstile(
  token: string | undefined,
  ip?: string,
  // Injectable for tests; env-driven in production code.
  secret = env.TURNSTILE_SECRET_KEY,
): Promise<TurnstileVerdict> {
  if (!secret) return 'unavailable';
  if (!token) return 'rejected';
  try {
    const response = await fetch(VERIFY_URL, {
      method: 'POST',
      body: new URLSearchParams({
        secret,
        response: token,
        ...(ip ? { remoteip: ip } : {}),
      }),
      signal: AbortSignal.timeout(5_000),
    });
    if (!response.ok) return 'unavailable';
    const result = (await response.json()) as { success?: boolean };
    return result.success === true ? 'ok' : 'rejected';
  } catch {
    return 'unavailable';
  }
}
