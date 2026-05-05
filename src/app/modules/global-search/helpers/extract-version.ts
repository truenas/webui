/**
 * Extracts the major version segment from a TrueNAS version string. Used to
 * build docs URLs (e.g. `truenas.com/docs/scale/27/...`), which are keyed on
 * the major version only.
 *
 * Examples:
 *   `TrueNAS-SCALE-27.0.0-MASTER-...` → `'27'`
 *   `25.10-BETA.1-INTERNAL.7`         → `'25'`
 *   `TrueNAS-SCALE-27-RELEASE`        → `'27'`
 *   `NoVersionHere`                   → `undefined`
 */
export function extractVersion(version: string | undefined | null): string | undefined {
  if (!version) return undefined;
  // Match a digit run optionally followed by `.<digits>` segments. The trailing
  // `*` (vs `+` previously) covers releases without a minor — e.g. a future
  // `TrueNAS-SCALE-27-RELEASE` build — so the docs URL doesn't silently lose
  // its version segment.
  return /(\d+)(?:\.\d+)*/.exec(version)?.[1];
}
