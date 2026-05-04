/**
 * Extracts the major version segment from a TrueNAS version string. Used to
 * build docs URLs (e.g. `truenas.com/docs/scale/27/...`), which are keyed on
 * the major version only.
 *
 * Examples:
 *   `TrueNAS-SCALE-27.0.0-MASTER-...` → `'27'`
 *   `25.10-BETA.1-INTERNAL.7`         → `'25'`
 *   `NoVersionHere`                   → `undefined`
 */
export function extractVersion(version: string | undefined | null): string | undefined {
  if (!version) return undefined;
  return /(\d+)(?:\.\d+)+/.exec(version)?.[1];
}
