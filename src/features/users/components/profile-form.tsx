'use client';

import { useActionState } from 'react';
import { useTranslations } from 'next-intl';
import { Button } from '@/components/ui/button';
import { updateProfile, type UserFormState } from '../server/actions';
import { Field, FormError } from '@/components/form/field';

const initialState: UserFormState = {};

/** Editable profile section — PATCH /users/me via the `updateProfile` action. */
export function ProfileForm({
  defaultValues,
}: {
  defaultValues: { fullName?: string; email?: string; address?: string };
}) {
  const t = useTranslations('Auth');
  const [state, formAction, pending] = useActionState(
    updateProfile,
    initialState,
  );

  return (
    <form action={formAction} className="flex flex-col gap-4">
      <Field
        label={t('account.profile.fullName')}
        name="fullName"
        type="text"
        autoComplete="name"
        defaultValue={defaultValues.fullName ?? ''}
        required
      />

      <Field
        label={t('account.profile.email')}
        name="email"
        type="email"
        autoComplete="email"
        defaultValue={defaultValues.email ?? ''}
        required
      />

      <Field
        label={t('account.profile.address')}
        name="address"
        type="text"
        autoComplete="street-address"
        defaultValue={defaultValues.address ?? ''}
      />

      <FormError message={state.error} />
      {state.success ? (
        <p className="text-sm text-emerald-600 dark:text-emerald-500">
          {t('account.profile.success')}
        </p>
      ) : null}

      <Button type="submit" disabled={pending} className="mt-2 self-start">
        {pending
          ? t('account.profile.submitting')
          : t('account.profile.submit')}
      </Button>
    </form>
  );
}
