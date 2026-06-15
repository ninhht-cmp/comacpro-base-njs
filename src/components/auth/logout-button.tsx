'use client';

import { useTranslations } from 'next-intl';
import { Button } from '@/components/ui/button';
import { logout } from '@/lib/auth/actions';

export function LogoutButton() {
  const t = useTranslations('Auth');

  return (
    <form action={logout}>
      <Button type="submit" variant="secondary">
        {t('account.logout')}
      </Button>
    </form>
  );
}
