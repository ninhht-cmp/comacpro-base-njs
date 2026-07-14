import { cn } from '@/lib/utils';

/**
 * Brand wordmark that SWAPS by theme instead of CSS-inverting: the full-colour
 * art (navy + orange) on light, a white-wordmark variant (orange accent kept)
 * on dark — so the brand colours survive dark mode instead of collapsing to a
 * silhouette. Both files ship; the theme class on <html> (set pre-paint by
 * ThemeScript, so no flash) shows the right one.
 *
 * `className` sets the size (e.g. `h-7`). Plain <img>: local SVGs gain nothing
 * from next/image.
 */
export function BrandLogo({ className }: { className?: string }) {
  return (
    <>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src="/brand/logo.svg"
        alt="SaleNet"
        width={180}
        height={36}
        className={cn('w-auto dark:hidden', className)}
      />
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src="/brand/logo-dark.svg"
        alt="SaleNet"
        width={180}
        height={36}
        className={cn('hidden w-auto dark:block', className)}
      />
    </>
  );
}
