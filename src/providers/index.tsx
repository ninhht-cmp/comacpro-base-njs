import type { ReactNode } from 'react';
import { NextIntlClientProvider } from 'next-intl';
import { ThemeProvider } from '@/components/theme';
import { HtmlLang } from '@/components/layout/html-lang';
import { Toaster } from '@/components/ui/sonner';
import { ReportWebVitals } from '@/lib/observability/report-web-vitals';

// Order matters: NextIntlClientProvider must be outermost so anything below
// (toasts, error boundaries, …) can call `t()`; portal targets like a Toaster
// sit after children. There is no client-side data-fetching provider by design
// — data flows RSC → props and mutations go through Server Actions (ADR 0002),
// which is also why API mocking is server-side only (see src/mocks).
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
        <ReportWebVitals />
        {children}
        <Toaster richColors position="top-center" />
      </ThemeProvider>
    </NextIntlClientProvider>
  );
}
