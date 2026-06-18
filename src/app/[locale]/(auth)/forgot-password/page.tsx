import { hasLocale } from 'next-intl';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import { notFound } from 'next/navigation';
import { ForgotPasswordForm } from '@/features/auth';
import { routing } from '@/i18n/routing';

export default async function ForgotPasswordPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  if (!hasLocale(routing.locales, locale)) notFound();
  setRequestLocale(locale);
  const t = await getTranslations('Auth');

  return (
    <main className="mx-auto flex min-h-[60vh] w-full max-w-sm flex-col justify-center gap-6 px-6 py-16">
      <div className="flex flex-col gap-2">
        <h1 className="text-2xl font-semibold tracking-tight text-foreground">
          {t('forgot.title')}
        </h1>
        <p className="text-sm text-muted-foreground">{t('forgot.subtitle')}</p>
      </div>
      <ForgotPasswordForm />
    </main>
  );
}
