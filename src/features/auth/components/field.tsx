import type { InputHTMLAttributes } from 'react';

export const fieldClassName =
  'h-10 w-full rounded-md border border-input bg-background px-3 text-sm outline-none ' +
  'focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/40';

/** Labeled text input shared by the auth forms. */
export function Field({
  label,
  ...props
}: { label: string } & InputHTMLAttributes<HTMLInputElement>) {
  return (
    <label className="flex flex-col gap-1.5 text-sm font-medium text-foreground">
      {label}
      <input className={fieldClassName} {...props} />
    </label>
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
