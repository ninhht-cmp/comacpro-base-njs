import { defineRouting } from 'next-intl/routing';

export const routing = defineRouting({
  locales: ['vi', 'en'] as const,
  defaultLocale: 'vi',
  localePrefix: 'as-needed',

  pathnames: {
    '/': '/',
    '/products': {
      vi: '/san-pham',
      en: '/products',
    },
    '/cart': {
      vi: '/gio-hang',
      en: '/cart',
    },
    '/checkout': {
      vi: '/thanh-toan',
      en: '/checkout',
    },
    '/account': {
      vi: '/tai-khoan',
      en: '/account',
    },
  },
});

export type Locale = (typeof routing.locales)[number];
