import { hasLocale } from 'next-intl';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import { notFound } from 'next/navigation';
import { BrandLogo } from '@/components/layout/brand-logo';
import { HeaderNav, type HeaderNavItem } from '@/components/layout/header-nav';
import { MobileMenu } from '@/components/layout/mobile-menu';
import { SiteFooter } from '@/components/layout/site-footer';
import { SiteHeader } from '@/components/layout/site-header';
import { CtaLink } from '@/components/marketing/cta-link';
import { ThemeToggleCompact } from '@/components/theme';
import { UserMenu } from '@/modules/auth';
import { getSession } from '@/core/session/server';
import { NotificationBell } from '@/modules/notifications';
import { fetchUnreadCount } from '@/modules/notifications/server';
import { Link } from '@/i18n/navigation';
import { routing } from '@/i18n/routing';

/**
 * App shell for the main surface (home, account, …): a clean single-row header
 * + footer. The `(auth)` group uses its own minimal layout, so auth screens
 * never render this chrome.
 *
 * NOTE: reading the session cookie opts this subtree into dynamic rendering —
 * acceptable for a personalized header. Enable PPR to stream just the
 * auth-dependent bits if the marketing pages need to be static.
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

  let unreadCount = 0;
  if (session) {
    try {
      unreadCount = await fetchUnreadCount(session.accessToken, locale);
    } catch {
      // A count failure must never break the shell.
    }
  }

  // One source of truth for the public nav — desktop (`HeaderNav`) + mobile
  // (`MobileMenu`). The brand logo is the "home" link, so it's not repeated.
  const navItems: HeaderNavItem[] = [
    { href: '/about-us', label: t('nav.about') },
    { href: '/download', label: t('nav.download') },
  ];

  return (
    <div className="flex min-h-svh flex-col">
      <SiteHeader
        navLabel={t('nav.main')}
        brand={
          <Link href="/" className="flex items-center">
            <BrandLogo className="h-7" />
          </Link>
        }
        nav={<HeaderNav items={navItems} />}
        actions={
          <>
            {session ? (
              <>
                <NotificationBell count={unreadCount} />
                <UserMenu user={session.user} />
              </>
            ) : (
              // Dark pill + chevron (Claude-docs CTA style); theme toggle
              // sits AFTER it.
              <CtaLink
                href="/signin"
                size="sm"
                arrow
                className="hidden md:inline-flex"
              >
                {t('nav.signin')}
              </CtaLink>
            )}
            <ThemeToggleCompact />
            <MobileMenu
              items={navItems}
              menuLabel={t('nav.menu')}
              signIn={
                session
                  ? undefined
                  : { href: '/signin', label: t('nav.signin') }
              }
            />
          </>
        }
      />
      <div className="flex flex-1 flex-col">{children}</div>
      <SiteFooter />
    </div>
  );
}
