'use client';

import type { ComponentProps } from 'react';
import { IconMenu2 } from '@tabler/icons-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Link, usePathname } from '@/i18n/navigation';
import { cn } from '@/lib/utils';
import type { HeaderNavItem } from './header-nav';

/**
 * Compact-viewport nav (shown below `md`, where `HeaderNav` is hidden): a
 * hamburger opening the same links, plus an optional guest sign-in action.
 * Reuses the Radix dropdown so focus-trap, escape and outside-click come for
 * free — no bespoke overlay to maintain.
 */
export function MobileMenu({
  items,
  menuLabel,
  signIn,
}: {
  items: HeaderNavItem[];
  /** Accessible name for the trigger (translated by the caller). */
  menuLabel: string;
  /** Guest sign-in link; omitted for signed-in users (the avatar menu owns it). */
  signIn?: { href: ComponentProps<typeof Link>['href']; label: string };
}) {
  const pathname = usePathname();

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        aria-label={menuLabel}
        className="inline-flex size-9 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-accent hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none md:hidden"
      >
        <IconMenu2 size={20} aria-hidden />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-52">
        {items.map(({ href, label }) => {
          const target = typeof href === 'string' ? href : '';
          const active =
            target !== '' &&
            (pathname === target || pathname.startsWith(`${target}/`));
          return (
            <DropdownMenuItem key={target || label} asChild>
              <Link
                href={href}
                aria-current={active ? 'page' : undefined}
                className={cn('cursor-pointer', active && 'text-foreground')}
              >
                {label}
              </Link>
            </DropdownMenuItem>
          );
        })}
        {signIn ? (
          <>
            <DropdownMenuSeparator />
            <DropdownMenuItem asChild>
              <Link href={signIn.href} className="cursor-pointer font-medium">
                {signIn.label}
              </Link>
            </DropdownMenuItem>
          </>
        ) : null}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
