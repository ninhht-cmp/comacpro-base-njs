import { defineRouting } from 'next-intl/routing';

export const routing = defineRouting({
  locales: ['vi', 'en'] as const,
  defaultLocale: 'vi',
  localePrefix: 'as-needed',

  pathnames: {
    '/': '/',
    '/signin': {
      vi: '/dang-nhap',
      en: '/signin',
    },
    '/signup': {
      vi: '/dang-ky',
      en: '/signup',
    },
    '/forgot-password': {
      vi: '/quen-mat-khau',
      en: '/forgot-password',
    },
    '/reset-password': {
      vi: '/dat-lai-mat-khau',
      en: '/reset-password',
    },
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
    '/notifications': {
      vi: '/thong-bao',
      en: '/notifications',
    },
  },
});

export type Locale = (typeof routing.locales)[number];
