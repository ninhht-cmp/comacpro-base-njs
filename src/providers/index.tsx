import type { ReactNode } from 'react';
import { NextIntlClientProvider } from 'next-intl';
import { ThemeProvider } from '@/components/theme';
import { HtmlLang } from '@/components/layout/html-lang';
import { Toaster } from '@/components/ui/sonner';
import { ReportWebVitals } from '@/lib/observability/report-web-vitals';
import { MswProvider } from './msw-provider';
import { QueryProvider } from './query-provider';

// Order matters: NextIntlClientProvider must be outermost so anything below
// (toasts, error boundaries, …) can call `t()`. Data providers go between
// i18n and UI; portal targets like a Toaster sit after children.
// MswProvider gates rendering until mocks are ready (no-op unless enabled), so
// it wraps the data layer to guarantee no request escapes before interception.
export function Providers({
  locale,
  children,
}: {
  locale: string;
  children: ReactNode;
}) {
  return (
    <NextIntlClientProvider>
      <MswProvider>
        <QueryProvider>
          <ThemeProvider>
            <HtmlLang locale={locale} />
            <ReportWebVitals />
            {children}
            <Toaster richColors position="top-center" />
          </ThemeProvider>
        </QueryProvider>
      </MswProvider>
    </NextIntlClientProvider>
  );
}
