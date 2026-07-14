'use client';

import { IconBell } from '@tabler/icons-react';
import { useTranslations } from 'next-intl';
import { Link } from '@/i18n/navigation';

/** Header bell: links to the notifications page with an unread-count badge. */
export function NotificationBell({ count }: { count: number }) {
  const t = useTranslations('Notifications');
  const label = count > 0 ? `${t('bell')} (${count})` : t('bell');

  return (
    <Link
      href="/notifications"
      aria-label={label}
      className="relative inline-flex size-8 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
    >
      <IconBell className="size-5" />
      {count > 0 ? (
        <span className="absolute -top-0.5 -right-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-destructive px-1 text-[10px] font-medium text-destructive-foreground">
          {count > 99 ? '99+' : count}
        </span>
      ) : null}
    </Link>
  );
}
