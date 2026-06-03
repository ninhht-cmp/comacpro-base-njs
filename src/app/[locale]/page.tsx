import { hasLocale } from 'next-intl';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import { notFound } from 'next/navigation';
import Image from 'next/image';
import {
  ThemeToggle,
  ThemeToggleCompact,
  ThemeToggleSwitch,
} from '@/components/theme';
import { Button } from '@/components/ui/button';
import { routing } from '@/i18n/routing';
import { LocaleSwitcher } from '@/components/common/locale-switcher';

export default async function Home({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  if (!hasLocale(routing.locales, locale)) notFound();
  setRequestLocale(locale);
  const t = await getTranslations('Home');

  return (
    <div className="flex flex-1 flex-col items-center justify-center bg-muted/40 font-sans">
      <main className="flex w-full max-w-3xl flex-1 flex-col items-center justify-between bg-background px-16 py-32 sm:items-start">
        <Image
          className="dark:invert"
          src="/next.svg"
          alt="Next.js logo"
          width={100}
          height={20}
          style={{ height: 'auto' }}
          priority
        />
        <div className="flex flex-col items-center gap-6 text-center sm:items-start sm:text-left">
          <h1 className="max-w-xs text-3xl leading-10 font-semibold tracking-tight text-foreground">
            {t('title')}
          </h1>
          <p className="max-w-md text-lg leading-8 text-muted-foreground">
            {t.rich('description', {
              templates: (chunks) => (
                <a
                  href="https://vercel.com/templates?framework=next.js&utm_source=create-next-app&utm_medium=appdir-template-tw&utm_campaign=create-next-app"
                  className="font-medium text-foreground"
                >
                  {chunks}
                </a>
              ),
              learning: (chunks) => (
                <a
                  href="https://nextjs.org/learn?utm_source=create-next-app&utm_medium=appdir-template-tw&utm_campaign=create-next-app"
                  className="font-medium text-foreground"
                >
                  {chunks}
                </a>
              ),
            })}
          </p>
        </div>
        <div className="flex flex-col items-center gap-4 text-base font-medium sm:flex-row">
          <Button variant="default" className="w-full md:w-[158px]" asChild>
            <a
              href="https://vercel.com/new?utm_source=create-next-app&utm_medium=appdir-template-tw&utm_campaign=create-next-app"
              target="_blank"
              rel="noopener noreferrer"
            >
              {t('deploy')}
            </a>
          </Button>
          <Button variant="secondary" className="w-full md:w-[158px]" asChild>
            <a
              href="https://nextjs.org/docs?utm_source=create-next-app&utm_medium=appdir-template-tw&utm_campaign=create-next-app"
              target="_blank"
              rel="noopener noreferrer"
            >
              {t('docs')}
            </a>
          </Button>
          <LocaleSwitcher />
          <ThemeToggle />
          <ThemeToggleCompact />
        </div>
        <div className="mt-8 flex w-full justify-center sm:justify-start">
          <ThemeToggleSwitch />
        </div>
      </main>
    </div>
  );
}
