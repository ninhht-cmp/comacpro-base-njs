import { hasLocale } from 'next-intl';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import { notFound } from 'next/navigation';
import { OtpForm } from '@/features/auth';
import { redirect } from '@/i18n/navigation';
import { routing } from '@/i18n/routing';
import { verifyForgotOtp } from '@/features/auth/server';

export default async function VerifyForgotOtpPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ email?: string }>;
}) {
  const { locale } = await params;
  if (!hasLocale(routing.locales, locale)) notFound();
  setRequestLocale(locale);

  const { email } = await searchParams;
  if (!email) {
    redirect({ href: '/forgot-password', locale });
    return null;
  }

  const t = await getTranslations('Auth');

  return (
    <main className="mx-auto flex min-h-[60vh] w-full max-w-sm flex-col justify-center gap-6 px-6 py-16">
      <div className="flex flex-col gap-2">
        <h1 className="text-2xl font-semibold tracking-tight text-foreground">
          {t('verifyForgot.title')}
        </h1>
        <p className="text-sm text-muted-foreground">
          {t('verifyForgot.subtitle', { email })}
        </p>
      </div>
      <OtpForm action={verifyForgotOtp} email={email} variant="verifyForgot" />
    </main>
  );
}
