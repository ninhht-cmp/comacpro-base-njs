import type { Locale } from '../routing';
import { Messages } from '../types';

// Adding a namespace to `Messages` without listing it here means the JSON
// silently never loads — TypeScript can't catch this gap.
const NAMESPACES = [
  'Common',
  'Home',
  'Errors',
  'Auth',
  'Notifications',
] as const satisfies ReadonlyArray<keyof Messages>;

export async function loadMessages(locale: Locale): Promise<Messages> {
  const entries = await Promise.all(
    NAMESPACES.map(
      async (ns) =>
        [ns, (await import(`./${locale}/${ns}.json`)).default] as const,
    ),
  );
  return Object.fromEntries(entries) as Messages;
}
