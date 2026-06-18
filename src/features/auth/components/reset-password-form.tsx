'use client';

import { useActionState } from 'react';
import { useTranslations } from 'next-intl';
import { Button } from '@/components/ui/button';
import { resetPassword, type AuthFormState } from '../server/actions';
import { Field, FormError } from './field';

const initialState: AuthFormState = {};

export function ResetPasswordForm({ token }: { token: string }) {
  const t = useTranslations('Auth');
  const [state, formAction, pending] = useActionState(
    resetPassword,
    initialState,
  );

  return (
    <form action={formAction} className="flex flex-col gap-4">
      <input type="hidden" name="token" value={token} />

      <Field
        label={t('newPassword')}
        name="newPassword"
        type="password"
        autoComplete="new-password"
        required
      />

      <Field
        label={t('confirmPassword')}
        name="confirmPassword"
        type="password"
        autoComplete="new-password"
        required
      />

      <FormError message={state.error} />

      <Button type="submit" disabled={pending} className="mt-2">
        {pending ? t('reset.submitting') : t('reset.submit')}
      </Button>
    </form>
  );
}
