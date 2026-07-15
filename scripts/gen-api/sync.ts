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
import { GENERATED_DIR, loadDotEnv, loadSpec, SNAPSHOT_PATH } from './io';

loadDotEnv();

const source = process.env.OPENAPI_SPEC;

if (!source || source === `./${SNAPSHOT_PATH}`) {
  console.error(
    '✗ gen:api:sync needs OPENAPI_SPEC (the live spec URL, e.g. ' +
      'https://…/docs-json) set in .env — syncing the snapshot from itself ' +
      'is a no-op. To regenerate from the committed snapshot, run `pnpm gen:api`.',
  );
  process.exit(1);
}

async function main(): Promise<void> {
  console.log(`Fetching spec from ${source} …`);
  const spec = await loadSpec(source!);

  // Compare CONTENT, not bytes: the committed snapshot is prettier-formatted
  // while a fresh serialization is not, so a byte diff is mostly formatting
  // noise (observed: 3k "changed" lines for an identical spec).
  let current: unknown;
  try {
    current = JSON.parse(readFileSync(SNAPSHOT_PATH, 'utf8'));
  } catch {
    current = undefined; // no/unreadable snapshot → treat as changed
  }
  if (JSON.stringify(spec) === JSON.stringify(current)) {
    console.log('Already in sync — the live spec matches the snapshot.');
    return;
  }

  // Re-serialize (stable 2-space form) so snapshot diffs are reviewable and
  // independent of the server's whitespace.
  writeFileSync(SNAPSHOT_PATH, `${JSON.stringify(spec, null, 2)}\n`);

  // Regenerate FROM THE SNAPSHOT (not the URL): proves the committed pair is
  // consistent — exactly what CI's check:api-fresh will verify.
  execSync('pnpm gen:api', {
    stdio: 'inherit',
    env: { ...process.env, OPENAPI_SPEC: `./${SNAPSHOT_PATH}` },
  });

  const diff = execSync(
    `git diff --stat -- ${SNAPSHOT_PATH} ${GENERATED_DIR}`,
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
