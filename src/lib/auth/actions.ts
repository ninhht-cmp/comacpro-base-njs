'use server';

import { getLocale } from 'next-intl/server';
import { redirect } from '@/i18n/navigation';
import { clearSession, setSession } from './cookies';
import { AuthError, signIn } from './service';

export type LoginError = 'missing_fields' | 'invalid_credentials' | 'unknown';

export interface LoginState {
  error?: LoginError;
}

/**
 * Server Action for the login form (`useActionState`). On success it sets the
 * session cookie and redirects to the account page; on failure it returns an
 * error code the form translates.
 */
export async function login(
  _prevState: LoginState,
  formData: FormData,
): Promise<LoginState> {
  const email = String(formData.get('email') ?? '').trim();
  const password = String(formData.get('password') ?? '');

  if (!email || !password) return { error: 'missing_fields' };

  try {
    const session = await signIn(email, password);
    await setSession(session);
  } catch (error) {
    if (error instanceof AuthError) {
      const credentialError = error.status === 400 || error.status === 401;
      return { error: credentialError ? 'invalid_credentials' : 'unknown' };
    }
    return { error: 'unknown' };
  }

  // Outside try/catch: redirect() throws NEXT_REDIRECT by design.
  const locale = await getLocale();
  redirect({ href: '/account', locale });
  return {}; // Unreachable (redirect throws); satisfies the return type.
}

export async function logout(): Promise<void> {
  await clearSession();
  const locale = await getLocale();
  redirect({ href: '/', locale });
}
