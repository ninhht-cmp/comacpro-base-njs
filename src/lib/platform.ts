/** Mobile platform detected from the User-Agent (store-button targeting). */
export type MobilePlatform = 'android' | 'ios' | 'other';

export function detectPlatform(userAgent: string | null): MobilePlatform {
  if (!userAgent) return 'other';
  if (/android/i.test(userAgent)) return 'android';
  // iPadOS 13+ reports itself as macOS; the touch hint below can't be read
  // server-side, so desktop-mode iPads get the two-button fallback — fine.
  if (/iphone|ipad|ipod/i.test(userAgent)) return 'ios';
  return 'other';
}
