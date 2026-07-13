import { useTranslations } from 'next-intl';
import { IconMessage2Check } from '@tabler/icons-react';
import { APP_STORE_URL, GOOGLE_PLAY_URL } from '@/config/app-links';
import type { MobilePlatform } from '@/lib/platform';
import { SuccessConfetti } from './success-confetti';

/**
 * Post-signup conversion state (rendered in the form card's slot), in three
 * visual beats: celebrate (illustration + title + welcome), inform (the
 * credentials-went-to-Zalo panel — the one thing the user must retain, so it
 * gets its own highlighted surface with the phone bolded), convert (labelled
 * store badges). The product lives in the mobile app; this is the funnel's
 * end state.
 *
 * Store badges are platform-ordered: a detected phone OS gets its own store
 * first; desktop and unknown agents keep the Google Play / App Store order.
 */
// Store names are brand names — never translated; only the prefix line is.
// Logos are the provided brand glyphs (assets/3), authored for a DARK badge
// (the apple is literally white) — the button surface stays black in both
// themes, like the official store badges.
// `prefixClass` mirrors the official badges' type treatment: Google's "GET IT
// ON" line is uppercase, Apple's "Download on the" is sentence case.
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

export function SignupSuccessCard({
  maskedPhone,
  platform,
}: {
  maskedPhone: string;
  platform: MobilePlatform;
}) {
  const t = useTranslations('Auth.signup.success');
  const stores = platform === 'ios' ? [...STORES].reverse() : STORES;

  return (
    <div className="flex flex-col items-center gap-6 py-2 text-center">
      {/* Fireworks fire once on mount — the PRG redirect means this mounts
          exactly when signup succeeds. */}
      <SuccessConfetti />

      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src="/assets/2/launch.svg"
        alt=""
        width={112}
        height={112}
        className="size-28"
      />

      <div className="flex flex-col gap-1.5">
        <h2 className="text-2xl font-semibold tracking-tight text-foreground">
          {t('title')}
        </h2>
        <p className="text-sm text-muted-foreground">{t('subtitle')}</p>
      </div>

      {/* The critical hand-off fact — where the credentials went — on its own
          highlighted surface, left-aligned for reading, phone kept unbroken. */}
      <div className="flex w-full items-start gap-3 rounded-xl border border-primary/20 bg-primary/5 p-4 text-left">
        <IconMessage2Check
          aria-hidden
          size={20}
          className="mt-0.5 shrink-0 text-primary"
        />
        <p className="text-sm leading-6 text-foreground">
          {t.rich('sentTo', {
            phone: maskedPhone,
            b: (chunks) => (
              <b className="font-semibold whitespace-nowrap">{chunks}</b>
            ),
          })}
        </p>
      </div>

      <div className="flex w-full flex-col items-center gap-3">
        <p className="text-xs font-medium tracking-widest text-muted-foreground uppercase">
          {t('download')}
        </p>
        {/* Official-badge anatomy as buttons: provided brand glyph + a small
            translated prefix over the large untranslated store name. Fixed
            black surface in both themes — the glyphs are dark-badge artwork —
            with a subtle ring so it keeps an edge on dark cards. Buttons hug
            their content and wrap (stack) on very narrow screens rather than
            truncate a brand name. */}
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
      </div>
    </div>
  );
}
