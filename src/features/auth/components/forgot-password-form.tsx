'use client';

import { useActionState } from 'react';
import { useTranslations } from 'next-intl';
import { Button } from '@/components/ui/button';
import { Link } from '@/i18n/navigation';
import { forgotPassword, type AuthFormState } from '../server/actions';
import { Field, FormError } from './field';

const initialState: AuthFormState = {};

export function ForgotPasswordForm() {
  const t = useTranslations('Auth');
  const [state, formAction, pending] = useActionState(
    forgotPassword,
    initialState,
  );

  return (
    <form action={formAction} className="flex flex-col gap-4">
      <Field
        label={t('email')}
        name="email"
        type="email"
        autoComplete="email"
        required
      />

      <FormError message={state.error} />

      <Button type="submit" disabled={pending} className="mt-2">
        {pending ? t('forgot.submitting') : t('forgot.submit')}
      </Button>

      <p className="text-center text-sm text-muted-foreground">
        <Link href="/signin" className="font-medium text-foreground underline">
          {t('links.toLogin')}
        </Link>
      </p>
    </form>
  );
}
