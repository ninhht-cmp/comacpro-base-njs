import type { ComponentProps } from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

/** Labeled input shared by forms — shadcn `Label` + `Input`. */
export function Field({
  label,
  id,
  name,
  ...props
}: { label: string } & ComponentProps<typeof Input>) {
  // Field names are unique per form, so they make stable input ids.
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
