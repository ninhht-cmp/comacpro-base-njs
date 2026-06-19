'use server';

import { getLocale, getTranslations } from 'next-intl/server';
import { clearSession, getSession, setSession } from '@/core/session/server';
import { redirect } from '@/i18n/navigation';
import { changePasswordSchema, updateProfileSchema } from '../schema';
import {
  UserApiError,
  cancelAccount as cancelAccountRequest,
  changePassword as changePasswordRequest,
  updateProfile as updateProfileRequest,
} from './service';

/**
 * Server Actions for the account-management forms (`useActionState`). Input is
 * validated at the boundary with the feature's zod schemas (`../schema`); the
 * session bearer token is read from the cookie and forwarded to the API. Each
 * action returns `{ error }` on failure or `{ success: true }` on success
 * (cancel-account redirects instead) with a ready-to-display message.
 */

export interface UserFormState {
  error?: string;
  success?: boolean;
}

async function userT() {
  const locale = await getLocale();
  return getTranslations({ locale, namespace: 'Auth' });
}

function messageFor(error: unknown, fallback: string): string {
  if (error instanceof UserApiError && error.message) return error.message;
  return fallback;
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
  if (!parsed.success) return { error: t('errors.missing_fields') };

  try {
    await updateProfileRequest(session.accessToken, parsed.data);
    // Keep the session snapshot in sync so the rest of the UI (header, account
    // page on next render) reflects the new values without a re-login.
    await setSession({
      ...session,
      user: {
        ...session.user,
        fullName: parsed.data.fullName,
        email: parsed.data.email,
      },
    });
  } catch (error) {
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
    };
  }

  try {
    await changePasswordRequest(session.accessToken, {
      oldPassword: parsed.data.oldPassword,
      newPassword: parsed.data.newPassword,
    });
  } catch (error) {
    if (
      error instanceof UserApiError &&
      (error.status === 400 || error.status === 401)
    ) {
      return { error: t('errors.invalid_password') };
    }
    return { error: messageFor(error, t('errors.unknown')) };
  }

  return { success: true };
}

// No params: invoked via `useActionState`, but neither the previous state nor
// the form payload is needed (extra args from the dispatcher are ignored).
export async function cancelAccount(): Promise<UserFormState> {
  const t = await userT();
  const session = await getSession();

  if (session) {
    try {
      await cancelAccountRequest(session.accessToken);
    } catch (error) {
      return { error: messageFor(error, t('errors.unknown')) };
    }
  }

  // Outside try/catch: clear the now-defunct session and leave the account area.
  await clearSession();
  const locale = await getLocale();
  redirect({ href: '/', locale });
  return {};
}
