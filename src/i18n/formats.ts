import type { Formats } from 'next-intl';

export const formats = {
  dateTime: {
    short: { day: 'numeric', month: 'short', year: 'numeric' },
    long: { day: 'numeric', month: 'long', year: 'numeric' },
    time: { hour: '2-digit', minute: '2-digit' },
  },
  number: {
    integer: { maximumFractionDigits: 0 },
    decimal: { minimumFractionDigits: 2, maximumFractionDigits: 2 },
    percent: { style: 'percent', maximumFractionDigits: 1 },
    currency: { style: 'currency', currency: 'VND' },
  },
  list: {
    enumeration: { style: 'long', type: 'conjunction' },
  },
} satisfies Formats;
