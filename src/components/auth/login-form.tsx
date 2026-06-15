'use client';

import { useActionState } from 'react';
import { useTranslations } from 'next-intl';
import { Button } from '@/components/ui/button';
import { login, type LoginState } from '@/lib/auth/actions';

const initialState: LoginState = {};

const fieldClassName =
  'h-10 w-full rounded-md border border-input bg-background px-3 text-sm outline-none ' +
  'focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/40';

export function LoginForm() {
  const t = useTranslations('Auth');
  const [state, formAction, pending] = useActionState(login, initialState);

  return (
    <form action={formAction} className="flex flex-col gap-4">
      <label className="flex flex-col gap-1.5 text-sm font-medium text-foreground">
        {t('email')}
        <input
          name="email"
          type="email"
          autoComplete="email"
          required
          className={fieldClassName}
        />
      </label>

      <label className="flex flex-col gap-1.5 text-sm font-medium text-foreground">
        {t('password')}
        <input
          name="password"
          type="password"
          autoComplete="current-password"
          required
          className={fieldClassName}
        />
      </label>

      {state.error ? (
        <p role="alert" className="text-sm text-destructive">
          {t(`errors.${state.error}`)}
        </p>
      ) : null}

      <Button type="submit" disabled={pending} className="mt-2">
        {pending ? t('signingIn') : t('signIn')}
      </Button>
    </form>
  );
}
