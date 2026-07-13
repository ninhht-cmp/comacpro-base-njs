import { useTranslations } from 'next-intl';
import { APP_STORE_URL, GOOGLE_PLAY_URL } from '@/config/app-links';
import type { MobilePlatform } from '@/lib/platform';

/**
 * Post-signup conversion state (rendered in the form card's slot): confirms
 * where the ZaloOA credentials went and hands off to the app stores — the
 * product lives in the mobile app, so this is the funnel's end state.
 *
 * Store badges are platform-ordered: a detected phone OS gets its own store
 * first; desktop and unknown agents keep the Google Play / App Store order.
 */
export function SignupSuccessCard({
  maskedPhone,
  platform,
}: {
  maskedPhone: string;
  platform: MobilePlatform;
}) {
  const t = useTranslations('Auth.signup.success');

  // Store badges are the artwork themselves — plain <img>, no next/image.
  const google = (
    <a href={GOOGLE_PLAY_URL} target="_blank" rel="noopener noreferrer">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src="/assets/3/playstore.svg"
        alt={t('googlePlay')}
        height={48}
        className="h-12 w-auto"
      />
    </a>
  );
  const apple = (
    <a href={APP_STORE_URL} target="_blank" rel="noopener noreferrer">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src="/assets/3/apple.svg"
        alt={t('appStore')}
        height={48}
        className="h-12 w-auto"
      />
    </a>
  );

  return (
    <div className="flex flex-col items-center gap-4 text-center">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src="/assets/2/launch.svg"
        alt=""
        width={160}
        height={160}
        className="size-40"
      />
      <div className="flex flex-col gap-1">
        <p className="text-lg font-semibold text-foreground">{t('title')}</p>
        <p className="text-sm text-muted-foreground">
          {t('sentTo', { phone: maskedPhone })}
        </p>
      </div>
      <div className="flex flex-wrap items-center justify-center gap-3">
        {platform === 'ios' ? (
          <>
            {apple}
            {google}
          </>
        ) : (
          <>
            {google}
            {apple}
          </>
        )}
      </div>
    </div>
  );
}
