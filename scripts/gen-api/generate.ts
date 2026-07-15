/**
 * `pnpm gen:api` entry — I/O shell around the pure generator in `./core`.
 *
 * Reads the OpenAPI spec (committed snapshot by default; `OPENAPI_SPEC` env
 * overrides with a path or URL), the operation scope
 * (`openapi/selection.json`, managed by `pnpm gen:api:pick`) and the optional
 * naming config (`openapi/codegen.json`), then rewrites
 * `src/lib/api/generated/model/index.ts` — the ONLY generated artifact.
 */
import { mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { generateModels, type CodegenConfig, type OpenApiSpec } from './core';

// Mirror gen-api-pick: load .env for OPENAPI_SPEC when run via plain tsx.
try {
  process.loadEnvFile('.env');
} catch {
  // No .env — fall back to the committed snapshot.
}

const SPEC_SOURCE = process.env.OPENAPI_SPEC ?? './openapi/openapi.json';
const SELECTION_PATH = join(process.cwd(), 'openapi/selection.json');
const CONFIG_PATH = join(process.cwd(), 'openapi/codegen.json');
const OUTPUT_DIR = join(process.cwd(), 'src/lib/api/generated');
const OUTPUT_FILE = join(OUTPUT_DIR, 'model/index.ts');

async function loadSpec(source: string): Promise<OpenApiSpec> {
  if (/^https?:\/\//.test(source)) {
    const response = await fetch(source);
    if (!response.ok) {
      throw new Error(
        `gen:api: fetching spec failed — ${response.status} ${source}`,
      );
    }
    return (await response.json()) as OpenApiSpec;
  }
  return JSON.parse(readFileSync(source, 'utf8')) as OpenApiSpec;
}

function loadSelection(): Set<string> | 'all' {
  let raw: string;
  try {
    raw = readFileSync(SELECTION_PATH, 'utf8');
  } catch {
    throw new Error(
      'gen:api: openapi/selection.json not found. Run `pnpm gen:api:pick`, ' +
        'or commit `{ "operations": "*" }` to generate the full spec.',
    );
  }
  const operations = (JSON.parse(raw) as { operations?: string[] | '*' })
    .operations;
  return operations === '*' ? 'all' : new Set(operations ?? []);
}

function loadConfig(): CodegenConfig {
  try {
    return JSON.parse(readFileSync(CONFIG_PATH, 'utf8')) as CodegenConfig;
  } catch {
    return {};
  }
}

async function main(): Promise<void> {
  const spec = await loadSpec(SPEC_SOURCE);
  const selection = loadSelection();
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
      `(${stats.dedupedSites} duplicate sites folded) → src/lib/api/generated/model/index.ts`,
  );
}

main().catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
