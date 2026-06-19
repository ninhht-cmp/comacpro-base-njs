'use client';

import { useActionState } from 'react';
import { useTranslations } from 'next-intl';
import { Button } from '@/components/ui/button';
import { Link } from '@/i18n/navigation';
import { signup, type AuthFormState } from '../server/actions';
import { Field, FormError } from '@/components/form/field';

const initialState: AuthFormState = {};

export function SignupForm() {
  const t = useTranslations('Auth');
  const [state, formAction, pending] = useActionState(signup, initialState);

  return (
    <form action={formAction} className="flex flex-col gap-4">
      <Field
        label={t('fullName')}
        name="fullName"
        type="text"
        autoComplete="name"
        required
      />

      <Field
        label={t('username')}
        name="username"
        type="text"
        autoComplete="username"
        required
      />

      <Field
        label={t('email')}
        name="email"
        type="email"
        autoComplete="email"
        required
      />

      <Field
        label={t('password')}
        name="password"
        type="password"
        autoComplete="new-password"
        required
      />

      <FormError message={state.error} />

      <Button type="submit" disabled={pending} className="mt-2">
        {pending ? t('signup.submitting') : t('signup.submit')}
      </Button>

      <p className="text-center text-sm text-muted-foreground">
        {t('links.haveAccount')}{' '}
        <Link href="/signin" className="font-medium text-foreground underline">
          {t('links.toLogin')}
        </Link>
      </p>
    </form>
  );
}
