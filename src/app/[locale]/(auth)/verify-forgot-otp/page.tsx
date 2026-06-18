import { hasLocale } from 'next-intl';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import { notFound } from 'next/navigation';
import { AuthCard, AuthToast, OtpForm } from '@/features/auth';
import { redirect } from '@/i18n/navigation';
import { routing } from '@/i18n/routing';
import { verifyForgotOtp } from '@/features/auth/server';

export default async function VerifyForgotOtpPage({
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
  if (!email) {
    redirect({ href: '/forgot-password', locale });
    return null;
  }

  const t = await getTranslations('Auth');

  return (
    <AuthCard
      title={t('verifyForgot.title')}
      description={t('verifyForgot.subtitle', { email })}
    >
      <AuthToast status={status} />
      <OtpForm action={verifyForgotOtp} email={email} variant="verifyForgot" />
    </AuthCard>
  );
}
