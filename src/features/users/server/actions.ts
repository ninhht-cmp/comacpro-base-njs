'use server';

import { getLocale, getTranslations } from 'next-intl/server';
import {
  ApiError,
  getSession,
  setSession,
  withAuthRetry,
} from '@/core/session/server';
import { redirect } from '@/i18n/navigation';
import { fieldErrorsFrom } from '@/lib/forms/field-errors';
import { changePasswordSchema, updateProfileSchema } from '../schema';
import {
  changePassword as changePasswordRequest,
  updateProfile as updateProfileRequest,
} from './service';

/**
 * Server Actions for the account-management forms (`useActionState`). Input is
 * validated at the boundary with the feature's zod schemas (`../schema`);
 * authenticated calls go through `withAuthRetry`, which retries once after a
 * token refresh when the API answers 401 (covers a tab that sat open past the
 * token TTL). Each action returns `{ error, fieldErrors }` on failure or
 * `{ success: true }` on success.
 */

export interface UserFormState {
  error?: string;
  /** Per-field, ready-to-display messages keyed by input `name`. */
  fieldErrors?: Record<string, string>;
  success?: boolean;
}

async function userT() {
  const locale = await getLocale();
  return getTranslations({ locale, namespace: 'Auth' });
}

function messageFor(error: unknown, fallback: string): string {
  if (error instanceof ApiError && error.message) return error.message;
  return fallback;
}

/** Expected 4xx rejections are user-facing; everything else must leave a trail. */
function logUserFailure(flow: string, error: unknown): void {
  if (error instanceof ApiError && error.status && error.status < 500) return;
  console.error(`[users] ${flow} failed`, error);
}

export async function updateProfile(
  _prevState: UserFormState,
  formData: FormData,
): Promise<UserFormState> {
  const t = await userT();
  const session = await getSession();
  if (!session) {
    const locale = await getLocale();
    redirect({ href: '/signin', locale });
    return {};
  }

  const parsed = updateProfileSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) {
    return {
      error: t('errors.missing_fields'),
      fieldErrors: fieldErrorsFrom(parsed.error, t),
    };
  }

  try {
    await withAuthRetry((accessToken) =>
      updateProfileRequest(accessToken, parsed.data),
    );
    // Keep the session snapshot in sync so the rest of the UI (header, account
    // page on next render) reflects the new values without a re-login. Re-read
    // the session: withAuthRetry may have rotated the tokens.
    const current = (await getSession()) ?? session;
    await setSession({
      ...current,
      user: {
        ...current.user,
        fullName: parsed.data.fullName,
        email: parsed.data.email,
      },
    });
  } catch (error) {
    logUserFailure('update-profile', error);
    return { error: messageFor(error, t('errors.unknown')) };
  }

  return { success: true };
}

export async function changePassword(
  _prevState: UserFormState,
  formData: FormData,
): Promise<UserFormState> {
  const t = await userT();
  const session = await getSession();
  if (!session) {
    const locale = await getLocale();
    redirect({ href: '/signin', locale });
    return {};
  }

  const parsed = changePasswordSchema.safeParse(Object.fromEntries(formData));
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
    await withAuthRetry((accessToken) =>
      changePasswordRequest(accessToken, {
        oldPassword: parsed.data.oldPassword,
        newPassword: parsed.data.newPassword,
      }),
    );
  } catch (error) {
    if (
      error instanceof ApiError &&
      (error.status === 400 || error.status === 401)
    ) {
      return { error: t('errors.invalid_password') };
    }
    logUserFailure('change-password', error);
    return { error: messageFor(error, t('errors.unknown')) };
  }

  return { success: true };
}
