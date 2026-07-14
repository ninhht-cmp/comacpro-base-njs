'use client';

import type { ReactNode } from 'react';
import { cn } from '@/lib/utils';
import { useSmartHeader } from './use-smart-header';

/**
 * Clean single-row marketing header (Stripe/Linear-style): brand + inline nav
 * on the left, a compact action cluster on the right. Deliberately minimal —
 * no search/command palette, no placeholder buttons — the product is a
 * five-page funnel, so the header's job is wayfinding + one clear CTA.
 *
 * Behaviour: sticky, smart show/hide (`useSmartHeader`), a translucent +
 * `backdrop-blur` lift once scrolled, `focus-within` reveal so a hidden
 * header never traps focus, and `prefers-reduced-motion` support.
 *
 * Pure presentation: auth/nav data is passed in as slots by the layout.
 */
export function SiteHeader({
  brand,
  nav,
  navLabel,
  actions,
}: {
  brand: ReactNode;
  nav?: ReactNode;
  /** Accessible name for the main <nav> (translated by the caller). */
  navLabel?: string;
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
          ? 'border-border bg-background/80 shadow-sm backdrop-blur-md supports-[backdrop-filter]:bg-background/70'
          : 'border-border/60 bg-background',
      )}
    >
      <div className="mx-auto flex h-16 w-full max-w-[100rem] items-center gap-6 px-4 sm:px-6 lg:px-8">
        {brand}
        {nav ? <nav aria-label={navLabel}>{nav}</nav> : null}
        {actions ? (
          <div className="ml-auto flex items-center gap-1.5">{actions}</div>
        ) : null}
      </div>
    </header>
  );
}
