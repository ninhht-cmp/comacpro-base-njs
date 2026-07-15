/**
 * `pnpm gen:api:sync` — the "backend changed" workflow in one command:
 * pull the latest spec from `OPENAPI_SPEC` into the committed snapshot
 * (`openapi/openapi.json`), regenerate the models from that snapshot, and
 * show what moved.
 *
 * There is deliberately no merge/patch step: generated models are derived
 * state, rewritten wholesale on every run — a renamed backend field simply
 * appears renamed, and `pnpm typecheck` then points at every mapper still
 * using the old name. That IS the update mechanism.
 */
import { execSync } from 'node:child_process';
import { readFileSync, writeFileSync } from 'node:fs';

try {
  process.loadEnvFile('.env');
} catch {
  // No .env — OPENAPI_SPEC may still come from the environment.
}

const SNAPSHOT = 'openapi/openapi.json';
const source = process.env.OPENAPI_SPEC;

if (!source || source === `./${SNAPSHOT}`) {
  console.error(
    '✗ gen:api:sync needs OPENAPI_SPEC (the live spec URL, e.g. ' +
      'https://…/docs-json) set in .env — syncing the snapshot from itself ' +
      'is a no-op. To regenerate from the committed snapshot, run `pnpm gen:api`.',
  );
  process.exit(1);
}

async function main(): Promise<void> {
  console.log(`Fetching spec from ${source} …`);
  let raw: string;
  if (/^https?:\/\//.test(source!)) {
    const response = await fetch(source!);
    if (!response.ok) {
      throw new Error(`fetching spec failed — HTTP ${response.status}`);
    }
    raw = await response.text();
  } else {
    raw = readFileSync(source!, 'utf8');
  }

  // Re-serialize (stable 2-space form) so snapshot diffs are reviewable and
  // independent of the server's whitespace.
  writeFileSync(SNAPSHOT, `${JSON.stringify(JSON.parse(raw), null, 2)}\n`);

  // Regenerate FROM THE SNAPSHOT (not the URL): proves the committed pair is
  // consistent — exactly what CI's check:api-fresh will verify.
  execSync('pnpm gen:api', {
    stdio: 'inherit',
    env: { ...process.env, OPENAPI_SPEC: `./${SNAPSHOT}` },
  });

  const diff = execSync(
    `git diff --stat -- ${SNAPSHOT} src/lib/api/generated`,
    { encoding: 'utf8' },
  ).trim();
  if (diff) {
    console.log(`\nChanged:\n${diff}`);
    console.log(
      '\nNext: `pnpm typecheck` — it will point at every consumer a renamed/removed field breaks.',
    );
  } else {
    console.log('\nAlready in sync — no spec or model changes.');
  }
}

main().catch((error: unknown) => {
  console.error(`✗ ${error instanceof Error ? error.message : error}`);
  process.exit(1);
});
