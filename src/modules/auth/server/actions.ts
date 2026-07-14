'use server';

import { getLocale, getTranslations } from 'next-intl/server';
import { cookies } from 'next/headers';
// The `?redirect=` target is an already-localized internal path; the i18n
// redirect would try to re-localize it, so navigate there verbatim.
// eslint-disable-next-line no-restricted-imports
import { redirect as redirectToPath } from 'next/navigation';
import { clearSession, setSession } from '@/core/session/server';
import { redirect } from '@/i18n/navigation';
import { clientContext } from '@/lib/api/client-context';
import { fieldErrorsFrom } from '@/lib/forms/field-errors';
import {
  TURNSTILE_FIELD,
  turnstileEnabled,
  verifyTurnstile,
} from '@/lib/security/turnstile';
import { VISITOR_COOKIE } from '@/lib/visitor';
import { stateFromApiError } from './api-error-map';
import { safeRedirect } from './redirect';
import { setSignupSuccess } from './signup-success';
import { signinSchema, signupSchema } from '../schema';
import { ApiError, signIn, signUp } from './service';

/**
 * Server Actions for the auth forms (`useActionState`). Input is validated at
 * the boundary with the feature's zod schemas (`../schema`). On success each
 * action redirects to the next step; on failure it returns
 * `{ error, fieldErrors }` with ready-to-display, TRANSLATED messages.
 * Backend rejection texts are raw English internals — they never reach the
 * UI directly; `stateFromApiError` maps the known ones (see api-error-map).
 *
 * Password recovery is deliberately absent: the mobile app owns that flow
 * (ADR 0005) — the web surface is the marketing/signup funnel.
 */

export interface AuthFormState {
  /** Form-level message (backend rejection, unknown failure). */
  error?: string;
  /** Per-field, ready-to-display messages keyed by input `name`. */
  fieldErrors?: Record<string, string>;
  /**
   * The submitted raw input, echoed back on failure. React resets
   * uncontrolled inputs to `defaultValue` after every form action — forms
   * seed `defaultValue` from here so a rejected submit keeps what the
   * visitor typed instead of wiping the form.
   */
  values?: Record<string, string>;
}

/** Backwards-compatible alias for the signin form. */
export type SigninState = AuthFormState;

async function authT() {
  const locale = await getLocale();
  return getTranslations({ locale, namespace: 'Auth' });
}

/**
 * Server-side trail for failed auth calls. Expected rejections (4xx) are
 * user-facing and stay quiet; everything else is an operational signal that
 * must not vanish into a generic "unknown error" message.
 */
function logAuthFailure(flow: string, error: unknown): void {
  if (error instanceof ApiError && error.status && error.status < 500) return;
  console.error(`[auth] ${flow} failed`, error);
}

/**
 * PII-masked phone for the signup trail (pattern from cmp-sm-fe): the logs
 * must support a fraud-investigation timeline (who tried, when, from which
 * IP) without spraying raw phone numbers across log storage.
 */
function maskPhone(phone: string): string {
  return phone.length < 7 ? '***' : `${phone.slice(0, 4)}xxx${phone.slice(-3)}`;
}

/**
 * Raw input for `AuthFormState.values`. Secrets never travel back, and the
 * Turnstile token is spent by the time the state renders — echoing either
 * would be dead weight at best.
 */
function submittedValues(formData: FormData): Record<string, string> {
  const values: Record<string, string> = {};
  for (const [name, value] of formData) {
    if (
      typeof value === 'string' &&
      !/password/i.test(name) &&
      name !== TURNSTILE_FIELD
    ) {
      values[name] = value;
    }
  }
  return values;
}

export async function signin(
  _prevState: AuthFormState,
  formData: FormData,
): Promise<AuthFormState> {
  const t = await authT();
  // Echoed back on failure so the phone survives the post-action form reset
  // (same pattern as signup); the password is filtered out by design.
  const values = submittedValues(formData);
  const parsed = signinSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) {
    return {
      error: t('errors.missing_fields'),
      fieldErrors: fieldErrorsFrom(parsed.error, t),
      values,
    };
  }

  try {
    const session = await signIn(parsed.data.username, parsed.data.password);
    await setSession(session);
  } catch (error) {
    if (
      error instanceof ApiError &&
      (error.status === 400 || error.status === 401)
    ) {
      return { error: t('errors.invalid_credentials'), values };
    }
    logAuthFailure('signin', error);
    return { ...stateFromApiError(error, t, 'signin'), values };
  }

  // Outside try/catch: redirect() throws NEXT_REDIRECT by design.
  const target = safeRedirect(formData.get('redirect'));
  if (target) redirectToPath(target);
  const locale = await getLocale();
  redirect({ href: '/account', locale });
  return {}; // Unreachable (redirect throws); satisfies the return type.
}

export async function signup(
  _prevState: AuthFormState,
  formData: FormData,
): Promise<AuthFormState> {
  const t = await authT();
  const values = submittedValues(formData);
  const parsed = signupSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) {
    return {
      error: t('errors.missing_fields'),
      fieldErrors: fieldErrorsFrom(parsed.error, t),
      values,
    };
  }

  // Visitor id ties this signup to the invite-link open that led here — the
  // same correlation the fraud rules need (many signups, one visitor).
  const sessionId = (await cookies()).get(VISITOR_COOKIE)?.value;
  const context = await clientContext(sessionId);

  console.info(
    `[auth] signup attempt phone=${maskPhone(parsed.data.username)} ` +
      `ref=<len:${parsed.data.referralCode.length}> ip=${context.ip ?? '<none>'}`,
  );

  // Anti-bot gate (opt-in via env, see lib/security/turnstile): a failed challenge
  // never reaches the backend — each signup call costs a paid ZaloOA send.
  if (turnstileEnabled()) {
    const token = formData.get(TURNSTILE_FIELD);
    const verdict = await verifyTurnstile(
      typeof token === 'string' ? token : undefined,
      context.ip,
    );
    if (verdict === 'rejected') {
      return { error: t('errors.captcha_failed'), values };
    }
    if (verdict === 'unavailable') {
      // Fail OPEN (Cloudflare outage must not block signups) — but loudly.
      console.error('[auth] signup turnstile verify unavailable, failing open');
    }
  }

  try {
    await signUp(parsed.data, context);
  } catch (error) {
    logAuthFailure('signup', error);
    return { ...stateFromApiError(error, t, 'signup'), values };
  }

  console.info(
    `[auth] signup success phone=${maskPhone(parsed.data.username)}`,
  );

  // SaleNet delivers credentials out-of-band (ZaloOA) and the product lives
  // in the mobile app — success swaps the form card for the app-download
  // state on the SAME landing (referrer sections stay). PRG via redirect:
  // refresh can't resubmit; the cookie proves the signup actually happened.
  await setSignupSuccess(parsed.data.username);
  const locale = await getLocale();
  redirect({
    href: {
      pathname: '/signup',
      query: { referral: parsed.data.referralCode, status: 'success' },
    },
    locale,
  });
  return {};
}

export async function logout(): Promise<void> {
  // KNOWN LIMITATION: SaleNet exposes no `/auth/logout`, so the refresh token
  // cannot be revoked server-side — it stays valid until its own TTL. Wire a
  // revocation call here the moment the endpoint exists.
  await clearSession();
  const locale = await getLocale();
  redirect({ href: '/', locale });
}
