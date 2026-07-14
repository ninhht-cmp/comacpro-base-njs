import type { ReactNode } from 'react';
import { BrandLogo } from '@/components/layout/brand-logo';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Link } from '@/i18n/navigation';

/**
 * Centered card shell shared by every auth page (sign-in + the invite-only
 * signup blocked states). The `(auth)` layout is chrome-less (no header), so
 * the brand logo above the card is the only wayfinding/identity anchor.
 */
export function AuthCard({
  title,
  description,
  children,
}: {
  title: string;
  description?: string;
  children: ReactNode;
}) {
  return (
    <main className="mx-auto flex min-h-[70vh] w-full max-w-sm flex-col justify-center gap-6 px-6 py-16">
      <Link href="/" className="flex justify-center">
        <BrandLogo className="h-8" />
      </Link>
      <Card>
        <CardHeader>
          <CardTitle className="font-heading text-2xl font-medium">
            {title}
          </CardTitle>
          {description ? (
            <CardDescription>{description}</CardDescription>
          ) : null}
        </CardHeader>
        <CardContent className="flex flex-col gap-4">{children}</CardContent>
      </Card>
    </main>
  );
}
