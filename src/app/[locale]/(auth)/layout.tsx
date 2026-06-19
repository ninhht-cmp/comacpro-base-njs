import { hasLocale } from 'next-intl';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import { notFound } from 'next/navigation';
import { Link } from '@/i18n/navigation';
import { routing } from '@/i18n/routing';

/**
 * Minimal shell for auth screens (sign-in/up, OTP, password reset): no sticky
 * header or nav — just the brand in the top-left corner over a centered card
 * (the card centers itself via `AuthCard`). Keeps the focus on the form.
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
  const t = await getTranslations('Common');

  return (
    <div className="relative min-h-svh">
      <div className="absolute top-4 left-4 sm:top-6 sm:left-6">
        <Link
          href="/"
          className="text-base font-semibold tracking-tight text-foreground"
        >
          {t('brand')}
        </Link>
      </div>
      {children}
    </div>
  );
}
