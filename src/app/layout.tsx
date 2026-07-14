import { Geist, Geist_Mono, Newsreader } from 'next/font/google';
import { getLocale } from 'next-intl/server';
import { ThemeScript } from '@/components/theme';
import '@/styles/globals.css';

const sans = Geist({
  variable: '--font-sans-local',
  subsets: ['latin'],
});

const mono = Geist_Mono({
  variable: '--font-mono-local',
  subsets: ['latin'],
});

// Editorial serif for display headings — the Claude-docs look. Their heading
// face (Tiempos/Copernicus) is licensed; Newsreader is the closest free
// match. `vietnamese` subset so diacritics render in the serif too.
const heading = Newsreader({
  variable: '--font-heading-local',
  subsets: ['latin', 'vietnamese'],
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
      className={`${sans.variable} ${heading.variable} ${mono.variable} h-full antialiased`}
    >
      <head>
        <ThemeScript />
      </head>
      <body className="flex min-h-full flex-col">{children}</body>
    </html>
  );
}
