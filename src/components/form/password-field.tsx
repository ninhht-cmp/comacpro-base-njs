'use client';

import { type ComponentProps, useState } from 'react';
import { useTranslations } from 'next-intl';
import { IconEye, IconEyeOff } from '@tabler/icons-react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';

/**
 * Password input with a show/hide toggle — standard login-UX that cuts typos,
 * especially on mobile numeric-heavy passwords. Mirrors `Field`'s markup
 * (label + input + error) but is its own client component so the shared
 * `Field` stays framework-neutral. The toggle is `tabIndex={-1}` so it never
 * sits between the field and the submit button in the tab order.
 */
export function PasswordField({
  label,
  id,
  name,
  error,
  className,
  ...props
}: { label: string; error?: string } & ComponentProps<typeof Input>) {
  const t = useTranslations('Common');
  const fieldId = id ?? name;
  const errorId = `${fieldId}-error`;
  const [revealed, setRevealed] = useState(false);

  return (
    <div className="flex flex-col gap-1.5">
      <Label htmlFor={fieldId}>{label}</Label>
      <div className="relative">
        <Input
          id={fieldId}
          name={name}
          type={revealed ? 'text' : 'password'}
          className={cn('pr-10', className)}
          {...props}
          {...(error
            ? { 'aria-invalid': true, 'aria-describedby': errorId }
            : null)}
        />
        <button
          type="button"
          tabIndex={-1}
          onClick={() => setRevealed((v) => !v)}
          aria-label={
            revealed ? t('form.hidePassword') : t('form.showPassword')
          }
          className="absolute inset-y-0 right-0 flex items-center px-3 text-muted-foreground transition-colors hover:text-foreground"
        >
          {revealed ? (
            <IconEyeOff size={16} aria-hidden />
          ) : (
            <IconEye size={16} aria-hidden />
          )}
        </button>
      </div>
      {error ? (
        <p id={errorId} className="text-sm text-destructive">
          {error}
        </p>
      ) : null}
    </div>
  );
}
