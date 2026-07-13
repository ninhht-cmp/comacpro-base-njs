import { Geist, Geist_Mono } from 'next/font/google';
import { getLocale } from 'next-intl/server';
import { ThemeScript } from '@/components/theme';
import '@/styles/globals.css';

const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
});

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
});

// Must stay stable across locale changes so the <script> in <head> never
// reconciles on the client (React 19 warns about that). Locale-dependent
// concerns belong to [locale]/layout.tsx — except `lang`: `getLocale()` works
// here at request time, so SSR emits the right attribute, and the `HtmlLang`
// client patcher (in Providers) keeps it in sync on client-side locale
// switches without re-rendering this layout.
export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const locale = await getLocale();
  return (
    <html
      lang={locale}
      suppressHydrationWarning
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <head>
        <ThemeScript />
      </head>
      <body className="flex min-h-full flex-col">{children}</body>
    </html>
  );
}
