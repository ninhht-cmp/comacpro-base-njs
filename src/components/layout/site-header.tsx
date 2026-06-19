'use client';

import type { ReactNode } from 'react';
import { cn } from '@/lib/utils';
import { useSmartHeader } from './use-smart-header';

/**
 * Sticky app-shell header with smart show/hide:
 * - sticky at the top, hides on scroll-down, reveals on scroll-up, always shown
 *   near the top (see `useSmartHeader`);
 * - translucent + `backdrop-blur` with a border/shadow only once scrolled, so it
 *   sits flush over hero content at the top and lifts off the page below it;
 * - keyboard focus inside the header reveals it (CSS-only `focus-within`), so a
 *   hidden header can never trap a focused control;
 * - respects `prefers-reduced-motion` (transitions snap off).
 *
 * Pure presentation: data-aware composition (auth state, nav) is passed in as
 * slots by the layout — this component imports no feature/core code.
 */
export function SiteHeader({
  brand,
  nav,
  actions,
}: {
  brand: ReactNode;
  nav?: ReactNode;
  actions?: ReactNode;
}) {
  const { hidden, scrolled } = useSmartHeader();

  return (
    <header
      data-scrolled={scrolled || undefined}
      className={cn(
        'sticky top-0 z-50 w-full border-b',
        'transition-[transform,background-color,border-color,box-shadow] duration-300 ease-out motion-reduce:transition-none',
        'will-change-transform focus-within:translate-y-0',
        hidden ? '-translate-y-full' : 'translate-y-0',
        scrolled
          ? 'border-border bg-background/70 shadow-sm backdrop-blur-md supports-[backdrop-filter]:bg-background/60'
          : 'border-transparent bg-transparent',
      )}
    >
      <div className="mx-auto flex h-14 max-w-6xl items-center gap-4 px-4 sm:px-6">
        <div className="flex items-center gap-6">
          {brand}
          {nav ? <nav aria-label="Main">{nav}</nav> : null}
        </div>
        {actions ? (
          <div className="ml-auto flex items-center gap-2">{actions}</div>
        ) : null}
      </div>
    </header>
  );
}
