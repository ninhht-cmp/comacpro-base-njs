import 'server-only';
import { cookies } from 'next/headers';
import { env } from '@/config/env';

/**
 * Post-signup handoff between the signup action and the success page (PRG:
 * the action redirects, so the page needs out-of-band proof that a signup
 * just happened — direct visits bounce back to /signup). The cookie carries
 * only the MASKED phone (no PII in URLs/logs) and lives for minutes.
 */

const COOKIE =
  env.NODE_ENV === 'production' ? '__Host-sn_signup_ok' : 'sn_signup_ok';

const MAX_AGE_SECONDS = 60 * 10;

/** `0981958280` → `09•••••280` — enough to confirm where the Zalo message went. */
export function maskPhone(phone: string): string {
  if (phone.length < 6) return phone;
  return `${phone.slice(0, 2)}${'•'.repeat(phone.length - 5)}${phone.slice(-3)}`;
}

export async function setSignupSuccess(phone: string): Promise<void> {
  (await cookies()).set(COOKIE, maskPhone(phone), {
    httpOnly: true,
    sameSite: 'lax',
    secure: env.NODE_ENV === 'production',
    path: '/',
    maxAge: MAX_AGE_SECONDS,
  });
}

/** Masked phone of the just-registered account, or null on direct visits. */
export async function readSignupSuccess(): Promise<string | null> {
  return (await cookies()).get(COOKIE)?.value ?? null;
}
