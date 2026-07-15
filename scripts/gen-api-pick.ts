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
import { readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import Enquirer from 'enquirer';

// Load .env for OPENAPI_SPEC (mirrors `gen:api`'s --env-file) before reading
// it below. Runs via `tsx` directly, so there is no node --env-file flag.
try {
  process.loadEnvFile('.env');
} catch {
  // No .env — fine; fall back to the committed snapshot.
}

const SPEC_SOURCE = process.env.OPENAPI_SPEC ?? './openapi/openapi.json';
const SELECTION_PATH = join(process.cwd(), 'openapi/selection.json');
const HTTP_METHODS = [
  'get',
  'put',
  'post',
  'delete',
  'options',
  'head',
  'patch',
  'trace',
] as const;

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

async function loadSpec(): Promise<Record<string, unknown>> {
  try {
    if (/^https?:\/\//.test(SPEC_SOURCE)) {
      const res = await fetch(SPEC_SOURCE);
      if (!res.ok) fail(`Fetching ${SPEC_SOURCE} failed: HTTP ${res.status}`);
      return (await res.json()) as Record<string, unknown>;
    }
    return JSON.parse(readFileSync(SPEC_SOURCE, 'utf8'));
  } catch (error) {
    return fail(
      `Could not read OpenAPI spec "${SPEC_SOURCE}": ${(error as Error).message}`,
    );
  }
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

function loadCurrentSelection(): Set<string> {
  try {
    const parsed = JSON.parse(readFileSync(SELECTION_PATH, 'utf8'));
    return new Set<string>(parsed.operations ?? []);
  } catch {
    return new Set();
  }
}

function writeSelection(keys: string[]): void {
  const payload = {
    $comment:
      'Managed by `pnpm gen:api:pick`. The set of OpenAPI operations whose models `pnpm gen:api` emits. Keys are `METHOD /path`. Edit via the picker, not by hand.',
    operations: [...keys].sort(),
  };
  writeFileSync(SELECTION_PATH, `${JSON.stringify(payload, null, 2)}\n`);
}

async function main() {
  const spec = await loadSpec();
  const operations = listOperations(spec);
  if (operations.length === 0) fail('No operations found in the spec.');

  const current = loadCurrentSelection();
  const pad = Math.max(...operations.map((o) => o.method.length));

  const prompt = new AutoComplete({
    name: 'operations',
    message:
      'Chọn API cần generate — gõ để tìm, ↑↓ di chuyển, space chọn, enter xác nhận',
    limit: 18,
    multiple: true,
    initial: operations.filter((o) => current.has(o.key)).map((o) => o.key),
    // `name` is the persisted key; `message` is the searchable, readable label.
    choices: operations.map((o) => ({
      name: o.key,
      message: `${o.method.padEnd(pad)}  ${o.path}${
        o.summary ? `  —  ${o.summary}` : ''
      }  [${o.tag}]`,
    })),
  });

  const picked = await prompt.run();

  const before = current;
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
