import { useTranslations } from 'next-intl';
import { IconMessage2Check } from '@tabler/icons-react';
import { StoreBadges } from '@/components/store-badges';
import type { MobilePlatform } from '@/lib/platform';
import { SuccessConfetti } from './success-confetti';

/**
 * Post-signup conversion state (rendered in the form card's slot), in three
 * visual beats: celebrate (illustration + title + welcome), inform (the
 * credentials-went-to-Zalo panel — the one thing the user must retain, so it
 * gets its own highlighted surface with the phone bolded), convert (the
 * shared store badges). The product lives in the mobile app; this is the
 * funnel's end state.
 */
export function SignupSuccessCard({
  maskedPhone,
  platform,
}: {
  maskedPhone: string;
  platform: MobilePlatform;
}) {
  const t = useTranslations('Auth.signup.success');

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
        <StoreBadges platform={platform} />
      </div>
    </div>
  );
}
