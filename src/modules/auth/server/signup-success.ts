import 'server-only';
import { cookies } from 'next/headers';
import { defineCookie } from '@/lib/cookies';
import { maskPhoneForDisplay } from '@/lib/mask';

/**
 * Post-signup handoff between the signup action and the success page (PRG:
 * the action redirects, so the page needs out-of-band proof that a signup
 * just happened — direct visits bounce back to /signup). The cookie carries
 * only the MASKED phone (no PII in URLs/logs) and lives for minutes.
 */

const MAX_AGE_SECONDS = 60 * 10;
const { name: COOKIE, options: cookieOptions } = defineCookie(
  'sn_signup_ok',
  MAX_AGE_SECONDS,
);

export async function setSignupSuccess(phone: string): Promise<void> {
  (await cookies()).set(COOKIE, maskPhoneForDisplay(phone), cookieOptions);
}

/** Masked phone of the just-registered account, or null on direct visits. */
export async function readSignupSuccess(): Promise<string | null> {
  return (await cookies()).get(COOKIE)?.value ?? null;
}
