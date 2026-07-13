'use client';

import { useActionState } from 'react';
import { useTranslations } from 'next-intl';
import { Button } from '@/components/ui/button';
import { Link } from '@/i18n/navigation';
import { forgotPassword, type AuthFormState } from '../server/actions';
import { Field, FormError } from '@/components/form/field';

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
        label={t('username')}
        name="username"
        type="tel"
        inputMode="numeric"
        autoComplete="tel"
        placeholder="09xxxxxxxx"
        required
        error={state.fieldErrors?.username}
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
