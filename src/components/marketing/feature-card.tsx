import type { TablerIcon } from '@tabler/icons-react';
import { Card, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils';

/**
 * Docs-style feature card: a flat bordered card with a brand-colored icon,
 * title and body. Restrained (no gradient, no lift) to match the Claude-docs
 * content aesthetic — only a subtle border tint on hover.
 */
export function FeatureCard({
  icon: Icon,
  title,
  body,
  className,
}: {
  icon: TablerIcon;
  title: string;
  body: string;
  className?: string;
}) {
  return (
    <Card
      className={cn(
        // Docs nav-card feel: flat by default, border brightens + faint wash
        // on hover. No lift/motion.
        'h-full shadow-none transition-colors hover:border-foreground/25 hover:bg-muted/30',
        className,
      )}
    >
      <CardContent className="flex flex-col gap-3">
        <span className="flex size-10 items-center justify-center rounded-lg bg-brand/10 text-brand">
          <Icon size={20} aria-hidden />
        </span>
        <h3 className="text-base font-semibold text-foreground">{title}</h3>
        <p className="text-sm leading-6 text-muted-foreground">{body}</p>
      </CardContent>
    </Card>
  );
}
