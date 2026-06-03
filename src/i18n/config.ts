import type { Locale } from './routing';

export const TIMEZONE = 'Asia/Ho_Chi_Minh';

export const LOCALE_LABELS: Record<Locale, { label: string; native: string }> =
  {
    vi: { label: 'Vietnamese', native: 'Tiếng Việt' },
    en: { label: 'English', native: 'English' },
  };

export const CURRENCY_BY_LOCALE: Record<Locale, string> = {
  vi: 'VND',
  en: 'USD',
};
