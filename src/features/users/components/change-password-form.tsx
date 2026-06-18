'use client';

import { useActionState } from 'react';
import { useTranslations } from 'next-intl';
import { Button } from '@/components/ui/button';
import { changePassword, type UserFormState } from '../server/actions';
import { Field, FormError } from './field';

const initialState: UserFormState = {};

/** Change-password section — PATCH /users/change-password. */
export function ChangePasswordForm() {
  const t = useTranslations('Auth');
  const [state, formAction, pending] = useActionState(
    changePassword,
    initialState,
  );

  return (
    <form action={formAction} className="flex flex-col gap-4">
      <Field
        label={t('account.password.current')}
        name="oldPassword"
        type="password"
        autoComplete="current-password"
        required
      />

      <Field
        label={t('account.password.new')}
        name="newPassword"
        type="password"
        autoComplete="new-password"
        required
      />

      <Field
        label={t('account.password.confirm')}
        name="confirmPassword"
        type="password"
        autoComplete="new-password"
        required
      />

      <FormError message={state.error} />
      {state.success ? (
        <p className="text-sm text-emerald-600 dark:text-emerald-500">
          {t('account.password.success')}
        </p>
      ) : null}

      <Button type="submit" disabled={pending} className="mt-2 self-start">
        {pending
          ? t('account.password.submitting')
          : t('account.password.submit')}
      </Button>
    </form>
  );
}
