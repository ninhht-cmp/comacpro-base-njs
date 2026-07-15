/**
 * Environment preflight — run after cloning to catch the usual "works on my
 * machine" gaps before `pnpm dev`.
 *
 *   pnpm doctor
 *
 * FAIL (exit 1): Node too old, missing `.env`, or missing `AUTH_SECRET`.
 * WARN: optional-but-recommended things (e.g. `OPENAPI_SPEC`, git hooks).
 */
import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

const CWD = process.cwd();

type Level = 'ok' | 'warn' | 'fail';
const checks: { level: Level; message: string }[] = [];
const add = (level: Level, message: string) => checks.push({ level, message });

/** Parse a dotenv file into a plain record (good enough for presence checks). */
function readEnv(path: string): Record<string, string> {
  const env: Record<string, string> = {};
  for (const line of readFileSync(path, 'utf8').split('\n')) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const eq = trimmed.indexOf('=');
    if (eq === -1) continue;
    env[trimmed.slice(0, eq).trim()] = trimmed
      .slice(eq + 1)
      .trim()
      .replace(/^["']|["']$/g, '');
  }
  return env;
}

function compareSemver(a: string, b: string): number {
  const pa = a.split('.').map(Number);
  const pb = b.split('.').map(Number);
  for (let i = 0; i < 3; i++) {
    const diff = (pa[i] ?? 0) - (pb[i] ?? 0);
    if (diff !== 0) return diff;
  }
  return 0;
}

// 1. Node version vs package.json engines.
const pkg = JSON.parse(readFileSync(join(CWD, 'package.json'), 'utf8')) as {
  engines?: { node?: string };
};
const required = pkg.engines?.node?.replace(/[^0-9.]/g, '') ?? '';
const current = process.versions.node;
if (required && compareSemver(current, required) < 0) {
  add(
    'fail',
    `Node ${current} < required ${pkg.engines?.node}. Use \`nvm use\`.`,
  );
} else {
  add('ok', `Node ${current} (requires ${pkg.engines?.node ?? 'any'})`);
}

// 2. .env presence + required keys.
const envPath = join(CWD, '.env');
if (!existsSync(envPath)) {
  add('fail', 'No `.env`. Copy it: `cp .env.example .env`.');
} else {
  const env = readEnv(envPath);
  if (!env.AUTH_SECRET) {
    add(
      'fail',
      'AUTH_SECRET is unset — required to encrypt sessions. Generate: `openssl rand -hex 32`.',
    );
  } else {
    add('ok', 'AUTH_SECRET is set');
  }

  if (!env.OPENAPI_SPEC) {
    add(
      'warn',
      'OPENAPI_SPEC unset — `gen:api` uses the committed snapshot (openapi/openapi.json); set it to the live spec URL to enable `gen:api:sync`.',
    );
  } else {
    add('ok', `OPENAPI_SPEC → ${env.OPENAPI_SPEC}`);
  }
}

// 3. Git hooks (husky) installed.
if (existsSync(join(CWD, '.husky'))) {
  add('ok', 'Husky hooks present');
} else {
  add('warn', 'No `.husky/` — run `pnpm install` to set up git hooks.');
}

// Report.
const icon = { ok: '✓', warn: '⚠', fail: '✗' } as const;
for (const { level, message } of checks) {
  console.log(`${icon[level]} ${message}`);
}

const failed = checks.filter((c) => c.level === 'fail').length;
if (failed > 0) {
  console.error(`\nDoctor found ${failed} blocking issue(s).`);
  process.exit(1);
}
console.log('\nDoctor: ready to go.');
