/**
 * Guards that the committed orval output matches the current OpenAPI spec.
 *
 * The generated client under `src/lib/api/generated` is committed so CI can
 * build without reaching the backend — but that means it can silently go stale
 * if someone changes the spec without running `pnpm gen:api`. This script
 * regenerates and fails if the working tree changed.
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
  console.log('Regenerating API client from the spec…');
  run('pnpm gen:api');

  // `--quiet --exit-code` returns non-zero when the generated dir differs.
  try {
    execSync(`git diff --quiet --exit-code -- ${GENERATED_DIR}`, {
      stdio: 'ignore',
    });
  } catch {
    console.error(
      `\n✗ Generated API client is out of date.\n` +
        `  ${GENERATED_DIR} changed after regeneration — commit the result of \`pnpm gen:api\`.\n`,
    );
    // Show what drifted to make the failure actionable.
    run(`git --no-pager diff --stat -- ${GENERATED_DIR}`);
    process.exit(1);
  }

  console.log('✓ Generated API client is in sync with the spec.');
}

main();
