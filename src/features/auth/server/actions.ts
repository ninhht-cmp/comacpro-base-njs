'use server';

import { getLocale, getTranslations } from 'next-intl/server';
// The `?redirect=` target is an already-localized internal path; the i18n
// redirect would try to re-localize it, so navigate there verbatim.
// eslint-disable-next-line no-restricted-imports
import { redirect as redirectToPath } from 'next/navigation';
import { redirect } from '@/i18n/navigation';
import { safeRedirect } from './redirect';
import {
  forgotPasswordSchema,
  googleAuthSchema,
  otpSchema,
  resetPasswordSchema,
  signinSchema,
  signupSchema,
} from '../schema';
import { clearSession, setSession } from './cookies';
import {
  AuthError,
  forgotPassword as forgotPasswordRequest,
  googleSignIn,
  resetPassword as resetPasswordRequest,
  signIn,
  signUp,
  verifyForgotOtp as verifyForgotOtpRequest,
  verifyOtp as verifyOtpRequest,
} from './service';

/**
 * Server Actions for the auth forms (`useActionState`). Input is validated at
 * the boundary with the feature's zod schemas (`../schema`). On success each
 * action redirects to the next step; on failure it returns `{ error }` with a
 * ready-to-display message (the backend's localized message when available,
 * otherwise a translated fallback) that the form renders inline.
 */

export interface AuthFormState {
  error?: string;
}

/** Backwards-compatible alias for the signin form. */
export type SigninState = AuthFormState;

async function authT() {
  const locale = await getLocale();
  return getTranslations({ locale, namespace: 'Auth' });
}

function messageFor(error: unknown, fallback: string): string {
  if (error instanceof AuthError && error.message) return error.message;
  return fallback;
}

export async function signin(
  _prevState: AuthFormState,
  formData: FormData,
): Promise<AuthFormState> {
  const t = await authT();
  const parsed = signinSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { error: t('errors.missing_fields') };

  try {
    const session = await signIn(parsed.data.username, parsed.data.password);
    await setSession(session);
  } catch (error) {
    if (
      error instanceof AuthError &&
      (error.status === 400 || error.status === 401)
    ) {
      return { error: t('errors.invalid_credentials') };
    }
    return { error: messageFor(error, t('errors.unknown')) };
  }

  // Outside try/catch: redirect() throws NEXT_REDIRECT by design.
  const target = safeRedirect(formData.get('redirect'));
  if (target) redirectToPath(target);
  const locale = await getLocale();
  redirect({ href: '/account', locale });
  return {}; // Unreachable (redirect throws); satisfies the return type.
}

/**
 * Sign in (or sign up) with a Google ID token obtained client-side. Called
 * imperatively from the Google button — not via `useActionState` — so it takes
 * the token directly. Returns `{ error }` on failure; redirects on success.
 */
export async function signinWithGoogle(
  idToken: string,
  redirectTo?: string,
): Promise<AuthFormState> {
  const t = await authT();
  const parsed = googleAuthSchema.safeParse({ idToken });
  if (!parsed.success) return { error: t('errors.unknown') };

  try {
    const session = await googleSignIn(parsed.data.idToken);
    await setSession(session);
  } catch (error) {
    return { error: messageFor(error, t('errors.unknown')) };
  }

  const target = safeRedirect(redirectTo);
  if (target) redirectToPath(target);
  const locale = await getLocale();
  redirect({ href: '/account', locale });
  return {};
}

export async function signup(
  _prevState: AuthFormState,
  formData: FormData,
): Promise<AuthFormState> {
  const t = await authT();
  const parsed = signupSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { error: t('errors.missing_fields') };

  try {
    await signUp(parsed.data);
  } catch (error) {
    return { error: messageFor(error, t('errors.unknown')) };
  }

  const locale = await getLocale();
  redirect({
    href: {
      pathname: '/verify-otp',
      query: { email: parsed.data.email, status: 'otp_sent' },
    },
    locale,
  });
  return {};
}

export async function verifyOtp(
  _prevState: AuthFormState,
  formData: FormData,
): Promise<AuthFormState> {
  const t = await authT();
  const parsed = otpSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { error: t('errors.missing_fields') };

  try {
    await verifyOtpRequest(parsed.data);
  } catch (error) {
    return { error: messageFor(error, t('errors.unknown')) };
  }

  const locale = await getLocale();
  redirect({
    href: { pathname: '/signin', query: { status: 'verified' } },
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
  if (!parsed.success) return { error: t('errors.missing_fields') };

  try {
    await forgotPasswordRequest(parsed.data.email);
  } catch (error) {
    return { error: messageFor(error, t('errors.unknown')) };
  }

  const locale = await getLocale();
  redirect({
    href: {
      pathname: '/verify-forgot-otp',
      query: { email: parsed.data.email, status: 'otp_sent' },
    },
    locale,
  });
  return {};
}

export async function verifyForgotOtp(
  _prevState: AuthFormState,
  formData: FormData,
): Promise<AuthFormState> {
  const t = await authT();
  const parsed = otpSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { error: t('errors.missing_fields') };

  let resetToken: string;
  try {
    ({ resetToken } = await verifyForgotOtpRequest(parsed.data));
  } catch (error) {
    return { error: messageFor(error, t('errors.unknown')) };
  }

  const locale = await getLocale();
  redirect({
    href: { pathname: '/reset-password', query: { token: resetToken } },
    locale,
  });
  return {};
}

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
    };
  }

  try {
    await resetPasswordRequest({
      resetToken: parsed.data.token,
      newPassword: parsed.data.newPassword,
    });
  } catch (error) {
    return { error: messageFor(error, t('errors.unknown')) };
  }

  const locale = await getLocale();
  redirect({
    href: { pathname: '/signin', query: { status: 'password_reset' } },
    locale,
  });
  return {};
}

export async function logout(): Promise<void> {
  await clearSession();
  const locale = await getLocale();
  redirect({ href: '/', locale });
}
