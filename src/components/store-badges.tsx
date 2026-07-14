import { useTranslations } from 'next-intl';
import { APP_STORE_URL, GOOGLE_PLAY_URL } from '@/config/app-links';
import type { MobilePlatform } from '@/lib/platform';

/**
 * Official-badge anatomy as buttons: provided brand glyph + a small
 * translated prefix over the large untranslated store name. Shared by the
 * signup success state and the download page.
 *
 * Platform-ordered: a detected phone OS gets its own store first; desktop
 * and unknown agents keep the Google Play / App Store order.
 */
// Store names are brand names — never translated; only the prefix line is.
// Logos are the provided brand glyphs (assets/3), authored for a DARK badge
// (the apple is literally white) — the button surface stays black in both
// themes, like the official store badges. `prefixClass` mirrors the official
// badges' type treatment: Google's "GET IT ON" line is uppercase, Apple's
// "Download on the" is sentence case.
const STORES = [
  {
    key: 'googlePlay',
    href: GOOGLE_PLAY_URL,
    src: '/assets/3/playstore.svg',
    name: 'Google Play',
    prefixClass: 'uppercase tracking-wider',
  },
  {
    key: 'appStore',
    href: APP_STORE_URL,
    src: '/assets/3/apple.svg',
    name: 'App Store',
    prefixClass: '',
  },
] as const;

export function StoreBadges({ platform }: { platform: MobilePlatform }) {
  const t = useTranslations('Common.stores');
  const stores = platform === 'ios' ? [...STORES].reverse() : STORES;

  return (
    // Buttons hug their content and wrap (stack) on very narrow screens
    // rather than truncate a brand name.
    <div className="flex flex-wrap items-center justify-center gap-3">
      {stores.map(({ key, href, src, name, prefixClass }) => (
        <a
          key={key}
          href={href}
          target="_blank"
          rel="noopener noreferrer"
          className="flex h-14 items-center gap-2.5 rounded-xl bg-neutral-950 px-4 text-white transition-opacity outline-none hover:opacity-85 focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 dark:ring-1 dark:ring-white/15"
        >
          {/* Plain <img>: local SVGs gain nothing from next/image. */}
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={src} alt="" className="h-7 w-auto shrink-0" />
          <span className="flex flex-col text-left">
            <span
              className={`text-[11px] leading-tight opacity-80 ${prefixClass}`}
            >
              {t(key)}
            </span>
            <span className="text-lg leading-tight font-medium tracking-tight">
              {name}
            </span>
          </span>
        </a>
      ))}
    </div>
  );
}
