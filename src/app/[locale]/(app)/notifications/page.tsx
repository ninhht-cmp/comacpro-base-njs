import { hasLocale } from 'next-intl';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import { notFound } from 'next/navigation';
import { requireSession } from '@/core/guard/require';
import { type Notification, NotificationList } from '@/features/notifications';
import {
  ApiError,
  fetchMyNotifications,
  fetchUnreadCount,
} from '@/features/notifications/server';
import { redirect } from '@/i18n/navigation';
import { routing } from '@/i18n/routing';

export default async function NotificationsPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  if (!hasLocale(routing.locales, locale)) notFound();
  setRequestLocale(locale);

  const session = await requireSession();
  const t = await getTranslations('Notifications');

  // The locale drives `Content-Language` so the backend returns localized text.
  let items: Notification[] = [];
  let unread = 0;
  let failed = false;
  try {
    const [page, count] = await Promise.all([
      fetchMyNotifications(session.accessToken, locale, { perPage: 50 }),
      fetchUnreadCount(session.accessToken, locale),
    ]);
    items = page.items;
    unread = count;
  } catch (error) {
    // A 401 means the session no longer satisfies the backend — re-auth.
    if (error instanceof ApiError && error.status === 401) {
      redirect({ href: '/signin', locale });
    }
    failed = true;
  }

  return (
    <main className="mx-auto w-full max-w-2xl px-6 py-10">
      <div className="mb-6 flex items-baseline justify-between gap-4">
        <h1 className="text-2xl font-semibold tracking-tight">{t('title')}</h1>
        {unread > 0 ? (
          <span className="text-sm text-muted-foreground">
            {t('unread', { count: unread })}
          </span>
        ) : null}
      </div>
      {failed ? (
        <p
          role="alert"
          className="rounded-lg border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm text-destructive"
        >
          {t('loadError')}
        </p>
      ) : (
        <NotificationList items={items} />
      )}
    </main>
  );
}
