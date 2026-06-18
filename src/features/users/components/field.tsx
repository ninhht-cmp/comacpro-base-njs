import type { ComponentProps } from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

/**
 * Labeled input shared by the account forms — shadcn `Label` + `Input`. Kept
 * local to the feature (the lint rules forbid cross-feature deep imports, so
 * each feature owns its small form primitives).
 */
export function Field({
  label,
  id,
  name,
  ...props
}: { label: string } & ComponentProps<typeof Input>) {
  const fieldId = id ?? name;
  return (
    <div className="flex flex-col gap-1.5">
      <Label htmlFor={fieldId}>{label}</Label>
      <Input id={fieldId} name={name} {...props} />
    </div>
  );
}

/** Inline form error message. Renders nothing when `message` is empty. */
export function FormError({ message }: { message?: string }) {
  if (!message) return null;
  return (
    <p role="alert" className="text-sm text-destructive">
      {message}
    </p>
  );
}
