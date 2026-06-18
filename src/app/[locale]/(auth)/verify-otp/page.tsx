import { hasLocale } from 'next-intl';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import { notFound } from 'next/navigation';
import { AuthCard, AuthToast, OtpForm } from '@/features/auth';
import { redirect } from '@/i18n/navigation';
import { routing } from '@/i18n/routing';
import { verifyOtp } from '@/features/auth/server';

export default async function VerifyOtpPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ email?: string; status?: string }>;
}) {
  const { locale } = await params;
  if (!hasLocale(routing.locales, locale)) notFound();
  setRequestLocale(locale);

  const { email, status } = await searchParams;
  // No email in the query → the flow was reached out of order; restart it.
  if (!email) {
    redirect({ href: '/signup', locale });
    return null;
  }

  const t = await getTranslations('Auth');

  return (
    <AuthCard
      title={t('verifyOtp.title')}
      description={t('verifyOtp.subtitle', { email })}
    >
      <AuthToast status={status} />
      <OtpForm action={verifyOtp} email={email} variant="verifyOtp" />
    </AuthCard>
  );
}
