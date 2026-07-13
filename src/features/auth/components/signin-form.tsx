'use client';

import { useActionState } from 'react';
import { useTranslations } from 'next-intl';
import { Button } from '@/components/ui/button';
import { Link } from '@/i18n/navigation';
import { signin, type AuthFormState } from '../server/actions';
import { Field, FormError } from '@/components/form/field';

const initialState: AuthFormState = {};

export function SigninForm({ redirect }: { redirect?: string }) {
  const t = useTranslations('Auth');
  const [state, formAction, pending] = useActionState(signin, initialState);

  return (
    <form action={formAction} className="flex flex-col gap-4">
      {redirect ? (
        <input type="hidden" name="redirect" value={redirect} />
      ) : null}

      <Field
        label={t('username')}
        name="username"
        type="text"
        autoComplete="username"
        required
        error={state.fieldErrors?.username}
      />

      <Field
        label={t('password')}
        name="password"
        type="password"
        autoComplete="current-password"
        required
        error={state.fieldErrors?.password}
      />

      <Link
        href="/forgot-password"
        className="self-end text-sm text-muted-foreground hover:text-foreground"
      >
        {t('forgot.link')}
      </Link>

      <FormError message={state.error} />

      <Button type="submit" disabled={pending} className="mt-2">
        {pending ? t('signingIn') : t('signIn')}
      </Button>

      <p className="text-center text-sm text-muted-foreground">
        {t('links.noAccount')}{' '}
        <Link href="/signup" className="font-medium text-foreground underline">
          {t('links.toSignup')}
        </Link>
      </p>
    </form>
  );
}
