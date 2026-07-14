import { getTranslations } from 'next-intl/server';
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

/**
 * Shared page shell (header + footer) rendered by the `(marketing)` and
 * `(app)` group layouts. Lives in `app/` (not `components/`) because it
 * composes domain modules (auth UserMenu, notifications bell) — that wiring
 * is the route layer's job.
 *
 * The two groups share one shell TODAY; the split exists so the `(app)`
 * surface can diverge (sidebar, product nav) without touching marketing.
 *
 * NOTE: reading the session cookie opts the subtree into dynamic rendering —
 * acceptable for a personalized header. Enable PPR to stream just the
 * auth-dependent bits if marketing pages ever need to be fully static.
 */
export async function SiteShell({
  children,
  locale,
}: {
  children: React.ReactNode;
  locale: string;
}) {
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
              // Dark pill + chevron (docs CTA style); theme toggle sits AFTER.
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
