import { hasLocale } from 'next-intl';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import { notFound } from 'next/navigation';
import { AuthCard, AuthToast, ResetPasswordForm } from '@/features/auth';
import { redirect } from '@/i18n/navigation';
import { routing } from '@/i18n/routing';

export default async function ResetPasswordPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ username?: string; status?: string }>;
}) {
  const { locale } = await params;
  if (!hasLocale(routing.locales, locale)) notFound();
  setRequestLocale(locale);

  const { username, status } = await searchParams;
  // No username → we don't know whose OTP to verify; restart the flow.
  if (!username) {
    redirect({ href: '/forgot-password', locale });
    return null;
  }

  const t = await getTranslations('Auth');

  return (
    <AuthCard
      title={t('reset.title')}
      description={t('reset.subtitle', { username })}
    >
      <AuthToast status={status} />
      <ResetPasswordForm username={username} />
    </AuthCard>
  );
}
