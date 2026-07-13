'use client';

import { useActionState, useState, useTransition } from 'react';
import { useTranslations } from 'next-intl';
import { Button } from '@/components/ui/button';
import { toast } from '@/components/ui/sonner';
import {
  resendForgotOtp,
  resetPassword,
  type AuthFormState,
} from '../server/actions';
import { Field, FormError } from '@/components/form/field';

const initialState: AuthFormState = {};

/** Resends are rate-limited client-side to stop button-mashing the backend. */
const RESEND_COOLDOWN_MS = 30_000;

/**
 * SaleNet's combined reset step: OTP (sent to the account's phone) + the new
 * password in one submit. `username` arrives via the query string from the
 * forgot-password step and travels as a hidden input.
 */
export function ResetPasswordForm({ username }: { username: string }) {
  const t = useTranslations('Auth');
  const [state, formAction, pending] = useActionState(
    resetPassword,
    initialState,
  );
  const [resending, startResend] = useTransition();
  const [cooldownUntil, setCooldownUntil] = useState(0);

  const resend = () => {
    if (Date.now() < cooldownUntil) return;
    setCooldownUntil(Date.now() + RESEND_COOLDOWN_MS);
    startResend(async () => {
      const result = await resendForgotOtp(username);
      if (result.error) toast.error(result.error);
      else toast.success(t('toast.otpSent'));
    });
  };

  return (
    <form action={formAction} className="flex flex-col gap-4">
      <input type="hidden" name="username" value={username} />

      <Field
        label={t('otp')}
        name="otpCode"
        type="text"
        inputMode="numeric"
        autoComplete="one-time-code"
        required
        error={state.fieldErrors?.otpCode}
      />

      <button
        type="button"
        onClick={resend}
        disabled={resending}
        className="self-start text-sm font-medium text-foreground underline disabled:opacity-50"
      >
        {resending ? t('reset.resending') : t('reset.resend')}
      </button>

      <Field
        label={t('newPassword')}
        name="newPassword"
        type="password"
        autoComplete="new-password"
        required
        error={state.fieldErrors?.newPassword}
      />

      <Field
        label={t('confirmPassword')}
        name="confirmPassword"
        type="password"
        autoComplete="new-password"
        required
        error={state.fieldErrors?.confirmPassword}
      />

      <FormError message={state.error} />

      <Button type="submit" disabled={pending} className="mt-2">
        {pending ? t('reset.submitting') : t('reset.submit')}
      </Button>
    </form>
  );
}
