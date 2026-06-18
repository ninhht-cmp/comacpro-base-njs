'use client';

import { useActionState, useState } from 'react';
import { useTranslations } from 'next-intl';
import { Button } from '@/components/ui/button';
import { cancelAccount, type UserFormState } from '../server/actions';
import { FormError } from './field';

const initialState: UserFormState = {};

/**
 * Danger-zone control — DELETE /users/me. Uses an inline two-step confirmation
 * (no dialog dependency) since the action is irreversible; on success the
 * action clears the session and redirects away.
 */
export function CancelAccountButton() {
  const t = useTranslations('Auth');
  const [confirming, setConfirming] = useState(false);
  const [state, formAction, pending] = useActionState(
    cancelAccount,
    initialState,
  );

  return (
    <div className="flex flex-col gap-3">
      {confirming ? (
        <form action={formAction} className="flex flex-col gap-3">
          <p className="text-sm text-muted-foreground">
            {t('account.danger.confirmQuestion')}
          </p>
          <div className="flex gap-2">
            <Button type="submit" variant="destructive" disabled={pending}>
              {pending
                ? t('account.danger.submitting')
                : t('account.danger.confirm')}
            </Button>
            <Button
              type="button"
              variant="ghost"
              onClick={() => setConfirming(false)}
              disabled={pending}
            >
              {t('account.danger.cancel')}
            </Button>
          </div>
        </form>
      ) : (
        <Button
          type="button"
          variant="destructive"
          className="self-start"
          onClick={() => setConfirming(true)}
        >
          {t('account.danger.trigger')}
        </Button>
      )}

      <FormError message={state.error} />
    </div>
  );
}
