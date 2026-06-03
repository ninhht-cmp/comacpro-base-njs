import type { Locale } from '../routing';
import type Common from './vi/Common.json';
import type Home from './vi/Home.json';
import type Errors from './vi/Errors.json';

export type Messages = {
  Common: typeof Common;
  Home: typeof Home;
  Errors: typeof Errors;
};

// Adding a namespace to `Messages` without listing it here means the JSON
// silently never loads — TypeScript can't catch this gap.
const NAMESPACES = [
  'Common',
  'Home',
  'Errors',
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
