import { hasLocale } from 'next-intl';
import { setRequestLocale } from 'next-intl/server';
import { notFound } from 'next/navigation';
import { routing } from '@/i18n/routing';

/**
 * Chrome-less shell for auth screens (sign-in/up, password reset, the invite
 * landing): no header at all — visitors arrive from app invite links where
 * the brand lives in the page copy itself; any corner chrome just competes
 * with the single call-to-action. The subtle top gradient lifts the pages off
 * a flat background in both themes (token-based, so dark mode follows).
 */
export default async function AuthLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  if (!hasLocale(routing.locales, locale)) notFound();
  setRequestLocale(locale);

  return (
    <div className="min-h-svh bg-gradient-to-b from-muted/60 via-background to-background">
      {children}
    </div>
  );
}
