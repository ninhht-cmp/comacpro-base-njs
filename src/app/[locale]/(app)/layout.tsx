import { hasLocale } from 'next-intl';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import { notFound } from 'next/navigation';
import { SiteFooter } from '@/components/layout/site-footer';
import { SiteHeader } from '@/components/layout/site-header';
import { ThemeToggleCompact } from '@/components/theme';
import { Button } from '@/components/ui/button';
import { UserMenu } from '@/features/auth';
import { getSession } from '@/core/session/server';
import { NotificationBell } from '@/features/notifications';
import { fetchUnreadCount } from '@/features/notifications/server';
import { Link } from '@/i18n/navigation';
import { routing } from '@/i18n/routing';

/**
 * Shell for the main application surface (home, account, …): the full sticky
 * `SiteHeader`. The `(auth)` group uses its own minimal layout instead, so auth
 * screens never render this chrome.
 *
 * NOTE: reading the session cookie opts this subtree into dynamic rendering —
 * acceptable for a personalized header. To keep marketing pages static, link
 * unconditionally to `/account` (the proxy redirects guests) or enable PPR to
 * stream just the auth action.
 */
export default async function AppLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  if (!hasLocale(routing.locales, locale)) notFound();
  setRequestLocale(locale);

  const t = await getTranslations('Common');
  const session = await getSession();

  // Unread badge for the header bell. Best-effort + resilient: a count failure
  // must never break the shell. (One backend call per app page — fine while the
  // shell is already dynamic; move to a BFF route + client polling if needed.)
  let unreadCount = 0;
  if (session) {
    try {
      unreadCount = await fetchUnreadCount(session.accessToken, locale);
    } catch {
      // leave at 0
    }
  }

  return (
    <div className="flex min-h-svh flex-col">
      <SiteHeader
        brand={
          <Link href="/" className="flex items-center">
            {/* Brand wordmark (fixed-color artwork). dark:invert+grayscale
                renders it as a white silhouette on dark — readable, if
                off-brand. TODO(design): ship a real dark variant.
                Plain <img>: local SVGs gain nothing from next/image. */}
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/brand/logo.svg"
              alt={t('brand')}
              width={180}
              height={36}
              className="h-7 w-auto dark:grayscale dark:invert"
            />
          </Link>
        }
        navLabel={t('nav.main')}
        nav={
          // No "home" item — the brand link already goes there.
          <ul className="hidden items-center sm:flex">
            {(
              [
                ['/about-us', 'nav.about'],
                ['/download', 'nav.download'],
              ] as const
            ).map(([href, key]) => (
              <li key={href}>
                <Link
                  href={href}
                  className="rounded-md px-3 py-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
                >
                  {t(key)}
                </Link>
              </li>
            ))}
          </ul>
        }
        actions={
          <>
            {session ? <NotificationBell count={unreadCount} /> : null}
            <ThemeToggleCompact />
            {session ? (
              <UserMenu user={session.user} />
            ) : (
              <Button asChild size="sm">
                <Link href="/signin">{t('nav.signin')}</Link>
              </Button>
            )}
          </>
        }
      />
      <div className="flex flex-1 flex-col">{children}</div>
      <SiteFooter />
    </div>
  );
}
