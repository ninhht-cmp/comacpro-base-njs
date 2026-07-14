/**
 * Initials for an avatar fallback: first + last word initial, or the first two
 * letters of a single-word name; blank input → "?". One shared implementation
 * (three copies had drifted — one didn't handle single-word names).
 */
export function initialsOf(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return '?';
  const first = parts[0] ?? '';
  if (parts.length === 1) return first.slice(0, 2).toUpperCase();
  const last = parts[parts.length - 1] ?? '';
  return `${first[0] ?? ''}${last[0] ?? ''}`.toUpperCase();
}
