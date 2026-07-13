import type { Formats } from 'next-intl';
import { CURRENCY_BY_LOCALE } from './config';
import type { Locale } from './routing';

// A factory (not a constant) because the currency format depends on the
// active locale — vi prices are VND, en prices are USD.
export function getFormats(locale: Locale) {
  return {
    dateTime: {
      short: { day: 'numeric', month: 'short', year: 'numeric' },
      long: { day: 'numeric', month: 'long', year: 'numeric' },
      time: { hour: '2-digit', minute: '2-digit' },
    },
    number: {
      integer: { maximumFractionDigits: 0 },
      decimal: { minimumFractionDigits: 2, maximumFractionDigits: 2 },
      percent: { style: 'percent', maximumFractionDigits: 1 },
      currency: { style: 'currency', currency: CURRENCY_BY_LOCALE[locale] },
    },
    list: {
      enumeration: { style: 'long', type: 'conjunction' },
    },
  } satisfies Formats;
}
