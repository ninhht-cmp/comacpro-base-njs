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
    '/verify-otp': {
      vi: '/xac-thuc-otp',
      en: '/verify-otp',
    },
    '/forgot-password': {
      vi: '/quen-mat-khau',
      en: '/forgot-password',
    },
    '/verify-forgot-otp': {
      vi: '/xac-thuc-otp-quen-mat-khau',
      en: '/verify-forgot-otp',
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
