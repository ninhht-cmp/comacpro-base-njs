/**
 * Shared I/O for the gen-api commands (generate / sync / pick / check-fresh).
 * Pure logic lives in `./core`; everything env/filesystem/network lives here,
 * so each command stays a thin orchestration and "how do we load the spec"
 * has exactly one answer.
 */
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import type { CodegenConfig, OpenApiSpec } from './core';

export const SNAPSHOT_PATH = 'openapi/openapi.json';
export const SELECTION_PATH = join(process.cwd(), 'openapi/selection.json');
export const CONFIG_PATH = join(process.cwd(), 'openapi/codegen.json');
export const GENERATED_DIR = 'src/lib/api/generated';

/** Load .env for OPENAPI_SPEC — tsx has no node --env-file, so mirror it. */
export function loadDotEnv(): void {
  try {
    process.loadEnvFile('.env');
  } catch {
    // No .env — the committed snapshot stays the default source.
  }
}

/** Where the spec comes from: OPENAPI_SPEC (URL or path) or the snapshot. */
export function specSource(): string {
  return process.env.OPENAPI_SPEC ?? `./${SNAPSHOT_PATH}`;
}

export async function loadSpec(source: string): Promise<OpenApiSpec> {
  if (/^https?:\/\//.test(source)) {
    const response = await fetch(source);
    if (!response.ok) {
      throw new Error(
        `fetching spec failed — HTTP ${response.status} ${source}`,
      );
    }
    return (await response.json()) as OpenApiSpec;
  }
  return JSON.parse(readFileSync(source, 'utf8')) as OpenApiSpec;
}

/**
 * The committed operation scope: a key list, `'all'` (`"operations": "*"`)
 * or `null` when the file doesn't exist yet (callers decide how strict to be:
 * `generate` fails with guidance, `pick` starts empty).
 */
export function readSelection(): string[] | 'all' | null {
  let raw: string;
  try {
    raw = readFileSync(SELECTION_PATH, 'utf8');
  } catch {
    return null;
  }
  const operations = (JSON.parse(raw) as { operations?: string[] | '*' })
    .operations;
  return operations === '*' ? 'all' : (operations ?? []);
}

export function loadConfig(): CodegenConfig {
  try {
    return JSON.parse(readFileSync(CONFIG_PATH, 'utf8')) as CodegenConfig;
  } catch {
    return {};
  }
}
