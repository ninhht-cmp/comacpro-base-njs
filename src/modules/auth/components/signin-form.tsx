'use client';

import { useActionState } from 'react';
import { useTranslations } from 'next-intl';
import { Button } from '@/components/ui/button';
import { Link } from '@/i18n/navigation';
import { signin, type AuthFormState } from '../server/actions';
import { Field, FormError } from '@/components/form/field';
import { PasswordField } from '@/components/form/password-field';
import { selectOnFocus } from '@/lib/forms/select-on-focus';

const initialState: AuthFormState = {};

export function SigninForm({ redirect }: { redirect?: string }) {
  const t = useTranslations('Auth');
  const [state, formAction, pending] = useActionState(signin, initialState);

  return (
    <form
      action={formAction}
      onFocus={selectOnFocus}
      className="flex flex-col gap-4"
    >
      {redirect ? (
        <input type="hidden" name="redirect" value={redirect} />
      ) : null}

      <Field
        label={t('username')}
        name="username"
        type="tel"
        inputMode="numeric"
        autoComplete="username"
        required
        autoFocus
        // Survives the post-action form reset on a failed submit (the
        // password is deliberately never echoed back).
        defaultValue={state.values?.username}
        error={state.fieldErrors?.username}
      />

      <PasswordField
        label={t('password')}
        name="password"
        autoComplete="current-password"
        required
        error={state.fieldErrors?.password}
      />

      {/* Password recovery lives in the mobile app (ADR 0005) — a static
          hint, not a link: there is no web flow to send the user to. */}
      <p className="text-sm text-muted-foreground">{t('forgot.inApp')}</p>

      <FormError message={state.error} />

      {/* h-10: matches the input height, same as the signup CTA. */}
      <Button type="submit" disabled={pending} className="mt-2 h-10">
        {pending ? t('signingIn') : t('signIn')}
      </Button>

      {/* Signup is invite-only, so we can't offer open registration — point
          new visitors at the app (where invites originate) instead. */}
      <p className="text-center text-sm text-muted-foreground">
        {t('links.noAccount')}{' '}
        <Link
          href="/download"
          className="font-medium text-foreground underline"
        >
          {t('links.getApp')}
        </Link>
      </p>
    </form>
  );
}
