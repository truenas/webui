/**
 * The parts of `src/` that have finished moving from `ApiService` to `TypedApiService`, and the
 * legacy modules they may no longer import.
 *
 * Shared by the two guardrails so they cannot disagree:
 *
 * - `eslint.config.mjs` turns each entry into a path-scoped `no-restricted-imports`, so a
 *   finished area cannot slide back to the legacy client.
 * - `scripts/check-api-migration.ts` counts what is left per area, and proves this list honest:
 *   an entry that no longer exists, or that still holds a legacy import the lint rule would have
 *   caught, fails the build — and so does an area that has finished migrating without being
 *   listed here, which is what keeps the list from going stale as the migration proceeds.
 *
 * `.mjs` because ESLint's flat config is ESM and loads it directly; `tsx` reads it just as well.
 *
 * See `docs/devs/typed-api-client.md` for how a call site moves.
 */

/**
 * Finished paths, relative to the repo root. A path ending in `.ts` is that one file; anything
 * else is a directory and covers everything below it, specs included — a spec that still scripts
 * `mockApi` is a call site that has not moved, whatever its component injects.
 *
 * Add an entry when the last legacy import in an area goes; `check-api-migration` will tell you
 * when that has happened and you have forgotten.
 */
export const migratedApiPaths = [
  // Phase 0's whole-feature pilot: eight components, their forms and their specs.
  'src/app/pages/credentials/backup-credentials',
  // The two shared services the Backup Credentials page runs on. Both are consumed from
  // elsewhere as well (`ix-ssh-credentials-select`, the cloud sync forms), so they are pinned
  // as files rather than waiting for `src/app/services` as a whole.
  'src/app/services/cloud-credential.service.ts',
  'src/app/services/cloud-credential.service.spec.ts',
  'src/app/services/keychain-credential.service.ts',
  'src/app/services/keychain-credential.service.spec.ts',
];

/**
 * Paths that own both clients by definition, and so are never "finished" in the sense the
 * ratchet means. `check-api-migration` neither asks for them to be pinned nor would be right to:
 * a rule banning the legacy client from the legacy client's own module is nonsense, and the two
 * spec doubles have to outlive every call site they stand in for — `mockApi` is deleted in
 * Phase 3, after the last consumer, not before.
 *
 * `interfaces/` is here for a different reason: files there alias the client's generated types
 * (`keychain-credential.interface.ts` is the pattern) without injecting anything. They are typed
 * dependants of the client and not call sites, so treating the directory as a migrated area
 * would pin 300 interface files on the strength of three type aliases.
 */
export const apiMigrationExemptPaths = [
  'src/app/modules/websocket',
  'src/app/core/testing',
  'src/app/interfaces',
];

/**
 * What a finished path may not import, as `no-restricted-imports` patterns.
 *
 * Both halves of the legacy client are named: the service itself, and `mockApi` — its spec
 * double is the only way a migrated component's spec can still be talking to the old dispatcher.
 *
 * Matched with a leading `**` rather than the exact `app/...` alias so a relative spelling of the
 * same module is rejected too.
 */
export const legacyApiImportPatterns = [
  '**/modules/websocket/api.service',
  '**/core/testing/utils/mock-api.utils',
];

/** The same, as a regular expression, for the script — which reads import lines as text. */
export const legacyApiImportPattern = /from '[^']*(?:modules\/websocket\/api\.service|core\/testing\/utils\/mock-api\.utils)'/;

/**
 * The typed client's counterparts: the service, the client token and the `mockTypedApi` double.
 * `typed-api/` covers the first two, and is deliberately a prefix — the token file is how a call
 * site names a generated type (`CallResponse<WebUiApiDirectory, …>`) without injecting anything.
 */
export const typedApiImportPattern = /from '[^']*(?:modules\/websocket\/typed-api\/[^']*|core\/testing\/(?:utils\/mock-typed-api\.utils|classes\/mock-typed-api\.service))'/;

/** Each finished path as an ESLint `files` pattern. */
export function migratedApiFilePatterns() {
  return migratedApiPaths.map((path) => (path.endsWith('.ts') ? path : `${path}/**/*.ts`));
}

/** Whether a repo-relative file sits inside a finished path. */
export function isMigratedPath(file) {
  return migratedApiPaths.some((path) => file === path || file.startsWith(`${path}/`));
}

/** Whether a repo-relative path is infrastructure the ratchet leaves alone. */
export function isExemptPath(file) {
  return apiMigrationExemptPaths.some((path) => file === path || file.startsWith(`${path}/`));
}
