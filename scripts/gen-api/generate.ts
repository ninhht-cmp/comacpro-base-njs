/**
 * `pnpm gen:api` entry — thin orchestration around the pure generator in
 * `./core` (I/O helpers in `./io`).
 *
 * Reads the OpenAPI spec (committed snapshot by default; `OPENAPI_SPEC` env
 * overrides with a path or URL), the operation scope
 * (`openapi/selection.json`, managed by `pnpm gen:api:pick`; `"*"` = full
 * spec) and the optional naming config (`openapi/codegen.json`), then
 * rewrites `src/lib/api/generated/model/index.ts` — the ONLY generated
 * artifact.
 */
import { mkdirSync, rmSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { generateModels } from './core';
import {
  GENERATED_DIR,
  loadConfig,
  loadDotEnv,
  loadSpec,
  readSelection,
  specSource,
} from './io';

loadDotEnv();

const OUTPUT_DIR = join(process.cwd(), GENERATED_DIR);
const OUTPUT_FILE = join(OUTPUT_DIR, 'model/index.ts');

async function main(): Promise<void> {
  const spec = await loadSpec(specSource());
  const read = readSelection();
  if (read === null) {
    throw new Error(
      'gen:api: openapi/selection.json not found. Run `pnpm gen:api:pick`, ' +
        'or commit `{ "operations": "*" }` to generate the full spec.',
    );
  }
  const selection = read === 'all' ? 'all' : new Set(read);
  const { content, stats } = generateModels(spec, selection, loadConfig());

  if (selection === 'all') {
    // Full-spec mode is a bootstrap convenience, not a resting state: every
    // schema lands in the emitted surface and nothing flags the unused ones.
    console.warn(
      'gen:api: full-spec mode ("operations": "*") — emitting every schema. ' +
        'Narrow with `pnpm gen:api:pick` once the needed surface is known.',
    );
  }

  // The generator owns the whole directory: a full rewrite means schemas that
  // fall out of the selection can never linger as orphaned files.
  rmSync(OUTPUT_DIR, { recursive: true, force: true });
  mkdirSync(join(OUTPUT_DIR, 'model'), { recursive: true });
  writeFileSync(OUTPUT_FILE, content);

  console.log(
    `gen:api ✓ ${stats.schemas} schemas, ${stats.enums} shared enums ` +
      `(${stats.dedupedSites} duplicate sites folded) → ${GENERATED_DIR}/model/index.ts`,
  );
}

main().catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
