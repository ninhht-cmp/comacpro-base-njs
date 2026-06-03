import type { ReactNode } from 'react';
import { NextIntlClientProvider } from 'next-intl';
import { ThemeProvider } from '@/components/theme';
import { HtmlLang } from '@/components/common/html-lang';

// Order matters: NextIntlClientProvider must be outermost so anything below
// (toasts, error boundaries, …) can call `t()`. Data providers go between
// i18n and UI; portal targets like a Toaster sit after children.
export function Providers({
  locale,
  children,
}: {
  locale: string;
  children: ReactNode;
}) {
  return (
    <NextIntlClientProvider>
      <ThemeProvider>
        <HtmlLang locale={locale} />
        {children}
      </ThemeProvider>
    </NextIntlClientProvider>
  );
}
