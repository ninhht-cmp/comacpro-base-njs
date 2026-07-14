'use client';

import { useFormatter, useTranslations } from 'next-intl';
import type { Notification } from '../api';
import { MarkReadButton } from './mark-read-button';

/** Renders the notification feed (data fetched server-side, passed as props). */
export function NotificationList({ items }: { items: Notification[] }) {
  const t = useTranslations('Notifications');
  const format = useFormatter();

  if (items.length === 0) {
    return <p className="text-sm text-muted-foreground">{t('empty')}</p>;
  }

  return (
    <ul className="flex flex-col divide-y divide-border">
      {items.map((n) => (
        <li
          key={n.id}
          className="flex items-start gap-3 py-4 first:pt-0 last:pb-0"
        >
          <span
            aria-hidden
            className={`mt-1.5 size-2 shrink-0 rounded-full ${
              n.isRead ? 'bg-transparent' : 'bg-primary'
            }`}
          />
          <div className="flex min-w-0 flex-1 flex-col gap-1">
            <div className="flex items-center justify-between gap-3">
              <p
                className={`truncate text-sm ${
                  n.isRead
                    ? 'text-muted-foreground'
                    : 'font-medium text-foreground'
                }`}
              >
                {n.description}
              </p>
              {n.createdAt ? (
                <time className="shrink-0 text-xs text-muted-foreground">
                  {format.dateTime(new Date(n.createdAt), {
                    dateStyle: 'medium',
                  })}
                </time>
              ) : null}
            </div>
            {!n.isRead ? (
              <div className="mt-1">
                <MarkReadButton id={n.id} />
              </div>
            ) : null}
          </div>
        </li>
      ))}
    </ul>
  );
}
