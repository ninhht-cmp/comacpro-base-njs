/**
 * Public store listings for the SaleNet mobile app. Plain constants
 * (identical across environments), not env vars.
 *
 * TODO(product): replace with the real listings once published. When the app
 * ships Universal Links / App Links, point the store URLs at the universal
 * link instead — installed apps will open directly, others fall through to
 * the store.
 */
export const APP_STORE_URL = 'https://apps.apple.com/app/salenet/id0000000000';
export const GOOGLE_PLAY_URL =
  'https://play.google.com/store/apps/details?id=vn.salenet.app';

/**
 * Numeric App Store id for Safari's Smart App Banner (`apple-itunes-app`).
 * `null` disables the banner — set it together with APP_STORE_URL; an invalid
 * id renders a broken banner, so it must not ship as a placeholder.
 */
export const APP_STORE_ID: string | null = null;
