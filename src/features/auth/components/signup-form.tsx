'use client';

import { useActionState } from 'react';
import { useTranslations } from 'next-intl';
import { Button } from '@/components/ui/button';
import { signup, type AuthFormState } from '../server/actions';
import { Field, FormError } from '@/components/form/field';

const initialState: AuthFormState = {};

export function SignupForm({
  referralCode,
}: {
  /**
   * From the invite link (`?referral=<phone>`); travels as a hidden input —
   * there is no visible field, signup is invite-only (see the signup page for
   * the invalid/missing-invite states). The backend re-validates on submit.
   */
  referralCode: string;
}) {
  const t = useTranslations('Auth');
  const [state, formAction, pending] = useActionState(signup, initialState);

  return (
    <form action={formAction} className="flex flex-col gap-4">
      <input type="hidden" name="referralCode" value={referralCode} />

      <Field
        label={t('fullName')}
        name="fullName"
        type="text"
        autoComplete="name"
        // Single-purpose page reached from an invite link — focus goes
        // straight to the first field (deliberate a11y trade-off).
        autoFocus
        required
        error={state.fieldErrors?.fullName}
      />

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

      <p className="text-sm text-muted-foreground">{t('signup.credentials')}</p>

      {/* The referral travels hidden, so a backend rejection of it must
          surface at form level — merge it with the general error slot. */}
      <FormError message={state.fieldErrors?.referralCode ?? state.error} />

      {/* h-10: matches the input height so the primary CTA never reads
          smaller than the fields it submits. */}
      {/* No "have an account? sign in" escape hatch here: this is an
          invite-only landing for NEW members, and the proxy already bounces
          signed-in visitors to /account. The invalid-invite state (see the
          page) keeps its sign-in link — there it's the only useful action. */}
      <Button type="submit" disabled={pending} className="mt-2 h-10">
        {pending ? t('signup.submitting') : t('signup.submit')}
      </Button>
    </form>
  );
}
