import type { ReactNode } from 'react';
import { NextIntlClientProvider } from 'next-intl';
import { ThemeProvider } from '@/components/theme';
import { HtmlLang } from '@/components/layout/html-lang';
import { Toaster } from '@/components/ui/sonner';
import { ReportWebVitals } from '@/lib/observability/report-web-vitals';
import { MswProvider } from './msw-provider';

// Order matters: NextIntlClientProvider must be outermost so anything below
// (toasts, error boundaries, …) can call `t()`; portal targets like a Toaster
// sit after children. MswProvider gates rendering until mocks are ready (no-op
// unless enabled), so no request escapes before interception. There is no
// client-side data-fetching provider by design — data flows RSC → props and
// mutations go through Server Actions (see docs/adr/0002-rsc-first-data-layer.md).
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
        <ThemeProvider>
          <HtmlLang locale={locale} />
          <ReportWebVitals />
          {children}
          <Toaster richColors position="top-center" />
        </ThemeProvider>
      </MswProvider>
    </NextIntlClientProvider>
  );
}
