import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import { NextIntlClientProvider } from 'next-intl';
import { APP_STORE_URL, GOOGLE_PLAY_URL } from '@/config/app-links';
import Common from '@/i18n/messages/vi/Common.json';
import type { MobilePlatform } from '@/lib/platform';
import { StoreBadges } from './store-badges';

function badgeHrefs(platform: MobilePlatform): (string | null)[] {
  render(
    <NextIntlClientProvider locale="vi" messages={{ Common }}>
      <StoreBadges platform={platform} />
    </NextIntlClientProvider>,
  );
  return screen.getAllByRole('link').map((a) => a.getAttribute('href'));
}

describe('StoreBadges', () => {
  it('puts the App Store first for iOS visitors', () => {
    expect(badgeHrefs('ios')).toEqual([APP_STORE_URL, GOOGLE_PLAY_URL]);
  });

  it('keeps Google Play first for Android and unknown platforms', () => {
    expect(badgeHrefs('android')).toEqual([GOOGLE_PLAY_URL, APP_STORE_URL]);
  });

  it('links open in a new tab with rel protection', () => {
    render(
      <NextIntlClientProvider locale="vi" messages={{ Common }}>
        <StoreBadges platform="other" />
      </NextIntlClientProvider>,
    );
    for (const link of screen.getAllByRole('link')) {
      expect(link).toHaveAttribute('target', '_blank');
      expect(link).toHaveAttribute('rel', expect.stringContaining('noopener'));
    }
  });
});
