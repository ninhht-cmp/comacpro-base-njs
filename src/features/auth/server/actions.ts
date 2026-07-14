'use server';

import { getLocale, getTranslations } from 'next-intl/server';
// The `?redirect=` target is an already-localized internal path; the i18n
// redirect would try to re-localize it, so navigate there verbatim.
// eslint-disable-next-line no-restricted-imports
import { redirect as redirectToPath } from 'next/navigation';
import { clearSession, setSession } from '@/core/session/server';
import { redirect } from '@/i18n/navigation';
import { fieldErrorsFrom } from '@/lib/forms/field-errors';
import { stateFromApiError } from './api-error-map';
import { safeRedirect } from './redirect';
import { setSignupSuccess } from './signup-success';
import {
  forgotPasswordSchema,
  resetPasswordSchema,
  signinSchema,
  signupSchema,
} from '../schema';
import {
  ApiError,
  forgotPassword as forgotPasswordRequest,
  resendForgotOtp as resendForgotOtpRequest,
  signIn,
  signUp,
  verifyForgotPassword as verifyForgotPasswordRequest,
} from './service';

/**
 * Server Actions for the auth forms (`useActionState`). Input is validated at
 * the boundary with the feature's zod schemas (`../schema`). On success each
 * action redirects to the next step; on failure it returns
 * `{ error, fieldErrors }` with ready-to-display, TRANSLATED messages.
 * Backend rejection texts are raw English internals — they never reach the
 * UI directly; `stateFromApiError` maps the known ones (see api-error-map).
 */

export interface AuthFormState {
  /** Form-level message (backend rejection, unknown failure). */
  error?: string;
  /** Per-field, ready-to-display messages keyed by input `name`. */
  fieldErrors?: Record<string, string>;
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

export async function signin(
  _prevState: AuthFormState,
  formData: FormData,
): Promise<AuthFormState> {
  const t = await authT();
  const parsed = signinSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) {
    return {
      error: t('errors.missing_fields'),
      fieldErrors: fieldErrorsFrom(parsed.error, t),
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
      return { error: t('errors.invalid_credentials') };
    }
    logAuthFailure('signin', error);
    return stateFromApiError(error, t);
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
  const parsed = signupSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) {
    return {
      error: t('errors.missing_fields'),
      fieldErrors: fieldErrorsFrom(parsed.error, t),
    };
  }

  try {
    await signUp(parsed.data);
  } catch (error) {
    logAuthFailure('signup', error);
    return stateFromApiError(error, t);
  }

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

export async function forgotPassword(
  _prevState: AuthFormState,
  formData: FormData,
): Promise<AuthFormState> {
  const t = await authT();
  const parsed = forgotPasswordSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) {
    return {
      error: t('errors.missing_fields'),
      fieldErrors: fieldErrorsFrom(parsed.error, t),
    };
  }

  try {
    await forgotPasswordRequest(parsed.data.username);
  } catch (error) {
    logAuthFailure('forgot-password', error);
    return stateFromApiError(error, t);
  }

  const locale = await getLocale();
  redirect({
    href: {
      pathname: '/reset-password',
      query: { username: parsed.data.username, status: 'otp_sent' },
    },
    locale,
  });
  return {};
}

/**
 * Resend the reset OTP. Called imperatively from the reset form's "resend"
 * button — not via `useActionState` — so it takes the username directly.
 */
export async function resendForgotOtp(
  username: string,
): Promise<AuthFormState> {
  const t = await authT();
  const parsed = forgotPasswordSchema.safeParse({ username });
  if (!parsed.success) return { error: t('errors.unknown') };

  try {
    await resendForgotOtpRequest(parsed.data.username);
  } catch (error) {
    logAuthFailure('resend-forgot-otp', error);
    return stateFromApiError(error, t);
  }
  return {};
}

/** One-shot OTP verification + new password (SaleNet's combined reset step). */
export async function resetPassword(
  _prevState: AuthFormState,
  formData: FormData,
): Promise<AuthFormState> {
  const t = await authT();
  const parsed = resetPasswordSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) {
    const mismatch = parsed.error.issues.some(
      (issue) => issue.message === 'passwords_mismatch',
    );
    return {
      error: mismatch
        ? t('errors.passwords_mismatch')
        : t('errors.missing_fields'),
      fieldErrors: fieldErrorsFrom(parsed.error, t),
    };
  }

  try {
    await verifyForgotPasswordRequest({
      username: parsed.data.username,
      otpCode: parsed.data.otpCode,
      newPassword: parsed.data.newPassword,
    });
  } catch (error) {
    logAuthFailure('reset-password', error);
    return stateFromApiError(error, t);
  }

  const locale = await getLocale();
  redirect({
    href: { pathname: '/signin', query: { status: 'password_reset' } },
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
