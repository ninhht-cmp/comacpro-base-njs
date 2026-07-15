/**
 * Guards that the committed generated models match the current OpenAPI spec.
 *
 * The generated models under `src/lib/api/generated` are committed so CI can
 * build without reaching the backend — but that means they can silently go
 * stale if someone changes the spec without running `pnpm gen:api`. This
 * script regenerates and fails if the working tree changed.
 *
 *   OPENAPI_SPEC=<url|path> pnpm check:api-fresh
 *
 * It needs access to the same spec source the committed code came from. In CI,
 * wire it as a job that runs only when an `OPENAPI_SPEC` repo variable/secret is
 * configured (see `.github/workflows/api-codegen.yml`); otherwise run it locally
 * before merging a spec change.
 */
import { execSync } from 'node:child_process';

const GENERATED_DIR = 'src/lib/api/generated';

function run(command: string): void {
  execSync(command, { stdio: 'inherit' });
}

function main(): void {
  console.log('Regenerating API models from the spec…');
  run('pnpm gen:api');

  // `git status --porcelain` (unlike `git diff`) also reports UNTRACKED files,
  // so a spec change that adds a brand-new generated file fails the check too.
  const drift = execSync(`git status --porcelain -- ${GENERATED_DIR}`, {
    encoding: 'utf-8',
  }).trim();
  if (drift) {
    console.error(
      `\n✗ Generated API models are out of date.\n` +
        `  ${GENERATED_DIR} changed after regeneration — commit the result of \`pnpm gen:api\`.\n`,
    );
    // Show what drifted to make the failure actionable.
    console.error(drift);
    process.exit(1);
  }

  console.log('✓ Generated API models are in sync with the spec.');
}

main();
