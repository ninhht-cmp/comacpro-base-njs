/**
 * Public store listings for the SaleNet mobile app. Plain constants, NOT env
 * vars: these URLs are public and identical in every environment, so an env
 * var would only add a way to misconfigure them with nothing gained.
 *
 * When the app ships Universal Links / App Links, point the store URLs at the
 * universal link instead — installed apps open directly, others fall through
 * to the store.
 */
export const APP_STORE_URL =
  'https://apps.apple.com/vn/app/comacpro-salenet/id6749012709';
// `&pli=1` (Play's "please log in" hint) dropped — not needed for a deep link.
export const GOOGLE_PLAY_URL =
  'https://play.google.com/store/apps/details?id=sm.comac.x';

/**
 * Numeric App Store id for Safari's Smart App Banner (`apple-itunes-app`),
 * from the App Store URL above. Enables the banner on the signup/download
 * pages (`metadata.itunes.appId`).
 */
export const APP_STORE_ID: string | null = '6749012709';
