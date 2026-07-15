/**
 * Interactive OpenAPI operation picker for `pnpm gen:api`.
 *
 * Reads the spec (`OPENAPI_SPEC` URL/path, else the committed snapshot),
 * lists every operation, lets you search + multi-select which ones to
 * generate models for, and writes the choice to `openapi/selection.json`.
 * That file is the deterministic source of truth the generator reads at gen
 * time (see scripts/gen-api/) — so CI stays reproducible and this step is
 * dev-only.
 *
 *   pnpm gen:api:pick   # choose, then run `pnpm gen:api`
 *
 * Kept separate from generation on purpose: an interactive gen would break
 * CI's `check:api-fresh`.
 */
import { writeFileSync } from 'node:fs';
import Enquirer from 'enquirer';
import { HTTP_METHODS } from './core';
import {
  loadDotEnv,
  loadSpec,
  readSelection,
  SELECTION_PATH,
  specSource,
} from './io';

loadDotEnv();

interface Operation {
  /** Stable key persisted to selection.json: `METHOD /path`. */
  key: string;
  method: string;
  path: string;
  summary: string;
  tag: string;
}

// enquirer ships loose types (no AutoComplete class in its .d.ts) — pin the
// slice we use so the rest of the file stays fully typed.
interface AutoCompleteCtor {
  new (opts: {
    name: string;
    message: string;
    limit?: number;
    multiple?: boolean;
    choices: { name: string; message: string }[];
    initial?: string[];
  }): { run(): Promise<string[]> };
}
const { AutoComplete } = Enquirer as unknown as {
  AutoComplete: AutoCompleteCtor;
};

function fail(message: string): never {
  console.error(`✗ ${message}`);
  process.exit(1);
}

function listOperations(spec: Record<string, unknown>): Operation[] {
  const paths = (spec.paths ?? {}) as Record<string, Record<string, unknown>>;
  const ops: Operation[] = [];
  for (const [path, item] of Object.entries(paths)) {
    for (const method of HTTP_METHODS) {
      const op = item[method] as
        | { summary?: string; tags?: string[] }
        | undefined;
      if (!op) continue;
      ops.push({
        key: `${method.toUpperCase()} ${path}`,
        method: method.toUpperCase(),
        path,
        summary: op.summary?.trim() ?? '',
        tag: op.tags?.[0] ?? '—',
      });
    }
  }
  // Group by tag, then path — a readable order for scanning + searching.
  ops.sort(
    (a, b) => a.tag.localeCompare(b.tag) || a.path.localeCompare(b.path),
  );
  return ops;
}

/** Current scope: 'all' (`"*"`), a key set, or empty when no file yet. */
function loadCurrentSelection(): Set<string> | 'all' {
  const read = readSelection();
  if (read === 'all') return 'all';
  return new Set(read ?? []);
}

function writeSelection(keys: string[]): void {
  const payload = {
    $comment:
      'The OpenAPI operations (`METHOD /path`) whose models `pnpm gen:api` emits; `"*"` = the full spec. Managed by `pnpm gen:api:pick`; hand-edits are fine — gen:api validates every key against the spec.',
    operations: [...keys].sort(),
  };
  writeFileSync(SELECTION_PATH, `${JSON.stringify(payload, null, 2)}\n`);
}

async function main() {
  const source = specSource();
  const spec = await loadSpec(source).catch((error: unknown) =>
    fail(
      `Could not read OpenAPI spec "${source}": ${error instanceof Error ? error.message : error}`,
    ),
  );
  const operations = listOperations(spec as Record<string, unknown>);
  if (operations.length === 0) fail('No operations found in the spec.');

  const current = loadCurrentSelection();
  const isSelected = (key: string) =>
    current === 'all' ? true : current.has(key);
  const pad = Math.max(...operations.map((o) => o.method.length));

  const prompt = new AutoComplete({
    name: 'operations',
    message:
      'Chọn API cần generate — gõ để tìm, ↑↓ di chuyển, space chọn, enter xác nhận',
    limit: 18,
    multiple: true,
    initial: operations.filter((o) => isSelected(o.key)).map((o) => o.key),
    // `name` is the persisted key; `message` is the searchable, readable label.
    choices: operations.map((o) => ({
      name: o.key,
      message: `${o.method.padEnd(pad)}  ${o.path}${
        o.summary ? `  —  ${o.summary}` : ''
      }  [${o.tag}]`,
    })),
  });

  const picked = await prompt.run();

  const before =
    current === 'all' ? new Set(operations.map((o) => o.key)) : current;
  const after = new Set(picked);
  const added = picked.filter((k) => !before.has(k));
  const removed = [...before].filter((k) => !after.has(k));

  if (added.length === 0 && removed.length === 0) {
    console.log('Không có thay đổi — selection.json giữ nguyên.');
    return;
  }

  console.log(`\n${after.size} operation được chọn.`);
  if (added.length) console.log(`  + thêm ${added.length}`);
  if (removed.length) console.log(`  − bỏ ${removed.length}`);

  writeSelection(picked);
  console.log(
    `\n✓ Đã ghi openapi/selection.json. Chạy \`pnpm gen:api\` để sinh model.`,
  );
}

main().catch((error) => {
  // Enquirer throws '' when the user cancels (Ctrl-C) — exit quietly then.
  if (error) fail((error as Error).message ?? String(error));
  process.exit(130);
});
