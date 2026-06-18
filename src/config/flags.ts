/**
 * Feature flags — a tiny, typed, vendor-agnostic seam.
 *
 * Defaults live here; environments override them via `NEXT_PUBLIC_FEATURE_FLAGS`
 * (comma-separated keys to force ON, e.g. `maintenanceBanner`). The `NEXT_PUBLIC_`
 * prefix is deliberate: the value is inlined into both the server and client
 * bundles, so a flag reads identically on each side (no hydration mismatch).
 * Trade-off — flips require a rebuild; a real provider (LaunchDarkly / Unleash)
 * gives runtime control. Swapping one in means changing only this file (make
 * `isEnabled` async or hydrate `overrides` from the provider's SDK).
 *
 * Isomorphic: safe to import in Server and Client components. Only expose flags
 * that are OK to ship to the browser bundle.
 */
import { env } from '@/config/env';

export const FLAGS = {
  /** Site-wide maintenance banner. Example flag — wire a real one as needed. */
  maintenanceBanner: false,
} as const satisfies Record<string, boolean>;

export type FlagKey = keyof typeof FLAGS;

const overrides: ReadonlySet<string> = new Set(
  (env.NEXT_PUBLIC_FEATURE_FLAGS ?? '')
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean),
);

/** Whether a feature flag is enabled (env override wins over the default). */
export function isEnabled(key: FlagKey): boolean {
  return overrides.has(key) || FLAGS[key];
}
