/**
 * Verifies that every locale defines the same set of message keys.
 *
 * `src/i18n/types.d.ts` gives compile-time safety against the default locale,
 * but it can't catch a *translation* that exists in one locale and is missing
 * in another. This runtime check compares the flattened key set of every
 * namespace across all locales and fails on any drift.
 *
 *   pnpm check:i18n
 */
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join } from 'node:path';

const MESSAGES_DIR = join(process.cwd(), 'src/i18n/messages');

type KeySet = Set<string>;

/** Flatten a nested message object into dotted key paths. */
function flatten(value: unknown, prefix = '', out: KeySet = new Set()): KeySet {
  if (value !== null && typeof value === 'object' && !Array.isArray(value)) {
    for (const [key, child] of Object.entries(value)) {
      flatten(child, prefix ? `${prefix}.${key}` : key, out);
    }
  } else {
    out.add(prefix);
  }
  return out;
}

function listLocales(): string[] {
  return readdirSync(MESSAGES_DIR).filter((entry) =>
    statSync(join(MESSAGES_DIR, entry)).isDirectory(),
  );
}

function listNamespaces(locale: string): string[] {
  return readdirSync(join(MESSAGES_DIR, locale))
    .filter((file) => file.endsWith('.json'))
    .map((file) => file.replace(/\.json$/, ''));
}

function loadKeys(locale: string, namespace: string): KeySet {
  const raw = readFileSync(
    join(MESSAGES_DIR, locale, `${namespace}.json`),
    'utf8',
  );
  return flatten(JSON.parse(raw));
}

function main(): void {
  const locales = listLocales();
  if (locales.length < 2) {
    console.log(`i18n: only ${locales.length} locale(s) — nothing to compare.`);
    return;
  }

  // Union of every namespace seen in any locale (catches a missing file too).
  const namespaces = new Set<string>();
  for (const locale of locales) {
    for (const ns of listNamespaces(locale)) namespaces.add(ns);
  }

  const problems: string[] = [];

  for (const namespace of [...namespaces].sort()) {
    const keysByLocale = new Map<string, KeySet>();
    for (const locale of locales) {
      try {
        keysByLocale.set(locale, loadKeys(locale, namespace));
      } catch {
        problems.push(`✗ ${locale}/${namespace}.json is missing`);
        keysByLocale.set(locale, new Set());
      }
    }

    const allKeys = new Set<string>();
    for (const keys of keysByLocale.values()) {
      for (const key of keys) allKeys.add(key);
    }

    for (const locale of locales) {
      const keys = keysByLocale.get(locale)!;
      const missing = [...allKeys].filter((key) => !keys.has(key)).sort();
      for (const key of missing) {
        problems.push(`✗ ${locale}/${namespace}: missing "${key}"`);
      }
    }
  }

  if (problems.length > 0) {
    console.error('i18n key mismatch:\n' + problems.join('\n'));
    process.exit(1);
  }

  console.log(
    `i18n: ${locales.length} locales × ${namespaces.size} namespaces — all keys aligned.`,
  );
}

main();
