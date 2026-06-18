'use client';

import { useActionState } from 'react';
import { useTranslations } from 'next-intl';
import { Button } from '@/components/ui/button';
import type { AuthFormState } from '../server/actions';
import { Field, FormError } from './field';

type OtpAction = (
  state: AuthFormState,
  formData: FormData,
) => Promise<AuthFormState>;

const initialState: AuthFormState = {};

/**
 * Shared OTP entry form used by both the signup verification and the
 * forgot-password verification steps. `email` is carried through a hidden field
 * so the server action can pair it with the code; `variant` selects the labels.
 */
export function OtpForm({
  action,
  email,
  variant,
}: {
  action: OtpAction;
  email: string;
  variant: 'verifyOtp' | 'verifyForgot';
}) {
  const t = useTranslations('Auth');
  const [state, formAction, pending] = useActionState(action, initialState);

  const submit =
    variant === 'verifyOtp' ? t('verifyOtp.submit') : t('verifyForgot.submit');
  const submitting =
    variant === 'verifyOtp'
      ? t('verifyOtp.submitting')
      : t('verifyForgot.submitting');

  return (
    <form action={formAction} className="flex flex-col gap-4">
      <input type="hidden" name="email" value={email} />

      <Field
        label={t('otp')}
        name="otp"
        type="text"
        inputMode="numeric"
        autoComplete="one-time-code"
        maxLength={6}
        required
      />

      <FormError message={state.error} />

      <Button type="submit" disabled={pending} className="mt-2">
        {pending ? submitting : submit}
      </Button>
    </form>
  );
}
