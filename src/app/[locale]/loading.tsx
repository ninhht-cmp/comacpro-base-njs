export default function Loading() {
  return (
    <div
      role="status"
      aria-live="polite"
      className="flex flex-1 items-center justify-center p-12"
    >
      <div
        aria-hidden
        className="h-8 w-8 animate-spin rounded-full border-2 border-muted-foreground/30 border-t-foreground"
      />
      <span className="sr-only">Loading</span>
    </div>
  );
}
