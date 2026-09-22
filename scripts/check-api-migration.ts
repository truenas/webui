#!/usr/bin/env tsx

/**
 * Tracks the move from `ApiService` to `TypedApiService`, and keeps the finished parts finished.
 *
 * The migration (`docs/devs/typed-api-client.md`) is hundreds of small PRs spread over months, so
 * two things are easy to lose: how far it has got, and whether an area that finished stayed
 * finished. This is both halves.
 *
 * **Progress.** `--report` prints remaining legacy dependants per area, so the number moves
 * visibly and a PR that adds one to a finished area is obvious. The unit is *files that import
 * the client*, not `inject(ApiService)` occurrences, for two reasons: about twenty dependants
 * never write `inject` at all — the `*.form-config.ts` helpers and `ApiDataProvider` take
 * `api: ApiService` as a parameter — and the import is exactly what the lint rule below keys on,
 * so the count and the gate cannot disagree about whether a file has moved.
 *
 * **Regression.** `scripts/api-migration-areas.mjs` lists the paths that have finished;
 * `eslint.config.mjs` reads it and bans the legacy imports there. This script proves that list
 * honest in both directions, which is the part lint cannot do:
 *
 * 1. An entry that matches no file — a folder renamed or deleted — fails, rather than leaving a
 *    rule that silently guards nothing.
 * 2. A listed path that still imports the legacy client fails. Lint would normally catch this
 *    first; it will not if the entry stops matching the moved file, which is the same failure as
 *    (1) seen from the other side.
 * 3. A directory that has *finished* — something below it uses the typed client, nothing below it
 *    uses the legacy one — and is not listed fails, naming itself. Without this the list only
 *    ever grows by someone remembering to add to it, and the ratchet is a ratchet for the areas
 *    somebody remembered. It reports the outermost such directory, so finishing a feature asks
 *    for one entry rather than one per component folder.
 *
 * What it deliberately does not do is ratchet the total. New code should use the typed client,
 * but ~400 files still legitimately inject the legacy one, and a repo-wide "must not increase"
 * gate on a number that large mostly produces merge conflicts. The per-area report is what makes
 * a new legacy dependant visible in review.
 *
 * Specs count. A component whose spec still scripts `mockApi` is talking to the legacy dispatcher
 * whatever it injects, so the gates read every `.ts`; the progress report reads non-spec files
 * only, which is the number `docs/devs/typed-api-client.md` quotes.
 */

import { existsSync, readdirSync, readFileSync } from 'fs';
import { sep } from 'path';
import {
  isExemptPath,
  isMigratedPath,
  legacyApiImportPattern,
  migratedApiPaths,
  typedApiImportPattern,
} from './api-migration-areas.mjs';

/**
 * Counted separately from the file totals, because the ticket that asked for this asked for
 * `inject()` sites and they are a finer-grained view of the same thing: one file can inject the
 * service once and call twenty methods through it, or be one of a feature's twelve components.
 * Reported, never gated.
 */
const legacyInjection = /\binject\(ApiService\)/g;
const typedInjection = /\binject\(TypedApiService\)/g;

interface FileFacts {
  /** Repo-relative path, forward slashes on every platform. */
  file: string;
  /** `pages/storage`, `services`, `store/jobs` — deep enough to own, shallow enough to read. */
  area: string;
  isSpec: boolean;
  legacy: boolean;
  typed: boolean;
  legacyInjections: number;
  typedInjections: number;
}

/**
 * The area a file is reported under: two segments below `src/app` (`pages/system`,
 * `modules/dialog`), or one where that is all there is (`services`, `store/jobs` being two
 * already). Files outside `src/app` — `main.ts`, `setup-jest.ts` — report under their directory.
 *
 * Two is the level features are owned and migrated at. One would put 300 of the 414 dependants
 * under `pages`; three splits `pages/system` into twenty rows nobody reads.
 */
function areaOf(file: string): string {
  const parts = file.split('/');
  if (!file.startsWith('src/app/')) {
    return parts.slice(0, -1).join('/');
  }
  // `src/app/app.component.ts` and friends have no segment of their own to report under.
  return parts.length === 3 ? 'app' : parts.slice(2, Math.min(4, parts.length - 1)).join('/');
}

function scan(): FileFacts[] {
  return readdirSync('src', { recursive: true, encoding: 'utf8' })
    .filter((entry) => entry.endsWith('.ts') && !entry.endsWith('.d.ts'))
    .map((entry) => `src/${entry.split(sep).join('/')}`)
    .sort((left, right) => left.localeCompare(right))
    .map((file) => {
      const src = readFileSync(file, 'utf8');
      return {
        file,
        area: areaOf(file),
        isSpec: file.endsWith('.spec.ts'),
        legacy: legacyApiImportPattern.test(src),
        typed: typedApiImportPattern.test(src),
        legacyInjections: [...src.matchAll(legacyInjection)].length,
        typedInjections: [...src.matchAll(typedInjection)].length,
      };
    });
}

interface Offender { file: string; what: string }

function report(title: string, offenders: Offender[], advice: string): void {
  if (!offenders.length) {
    return;
  }
  console.error(`\n❌ ${title}\n`);
  for (const { file, what } of offenders) {
    console.error(`  ${file}  ${what}`);
  }
  console.error(advice);
  process.exitCode = 1;
}

/** Gates 1 and 2: every listed path exists, and none of them imports the legacy client. */
function checkListedPaths(files: FileFacts[]): Offender[] {
  return migratedApiPaths.flatMap((path) => {
    if (!existsSync(path)) {
      return [{ file: path, what: 'listed as migrated, but there is nothing at this path' }];
    }
    const covered = files.filter(({ file }) => file === path || file.startsWith(`${path}/`));
    if (!covered.length) {
      return [{ file: path, what: 'listed as migrated, but covers no TypeScript file' }];
    }
    return covered
      .filter(({ legacy }) => legacy)
      .map(({ file }) => ({ file, what: 'imports the legacy client from a migrated path' }));
  });
}

/** The immediate subdirectories of `dir` that hold any of `files`. */
function childDirectories(dir: string, files: FileFacts[]): string[] {
  const depth = dir.split('/').length;
  return [...new Set(
    files
      .filter(({ file }) => file.startsWith(`${dir}/`) && file.split('/').length > depth + 1)
      .map(({ file }) => file.split('/').slice(0, depth + 1).join('/')),
  )];
}

/**
 * Gate 3: directories that have finished and are not pinned.
 *
 * Outermost-first: a directory with typed dependants and no legacy ones is reported and not
 * descended into, so a finished feature asks for its own entry rather than one per component
 * folder below it. A directory with no typed dependants at all is not "finished" — it is a part
 * of the app that never talked to middleware — and is skipped before the legacy test, which is
 * what keeps the report to areas the migration has actually touched.
 */
function unpinnedFinishedDirectories(files: FileFacts[]): Offender[] {
  const found: Offender[] = [];

  const visit = (dir: string): void => {
    if (isMigratedPath(dir) || isExemptPath(dir)) {
      return;
    }
    const inside = files.filter(({ file }) => file.startsWith(`${dir}/`));
    if (!inside.some(({ typed }) => typed)) {
      return;
    }
    if (!inside.some(({ legacy }) => legacy)) {
      found.push({
        file: dir,
        what: `${inside.filter(({ typed }) => typed).length} typed files, no legacy ones left`,
      });
      return;
    }
    for (const child of childDirectories(dir, files)) {
      visit(child);
    }
  };

  visit('src/app');
  return found;
}

/** `--report`: remaining legacy dependants per area, most first. */
function reportProgress(files: FileFacts[]): void {
  const production = files.filter(({ isSpec }) => !isSpec);
  const areas = new Map<string, { legacy: number; typed: number }>();
  for (const { area, legacy, typed } of production) {
    if (!legacy && !typed) {
      continue;
    }
    const counts = areas.get(area) ?? { legacy: 0, typed: 0 };
    areas.set(area, { legacy: counts.legacy + Number(legacy), typed: counts.typed + Number(typed) });
  }

  for (const [area, { legacy, typed }] of [...areas].sort(
    (left, right) => right[1].legacy - left[1].legacy || left[0].localeCompare(right[0]),
  )) {
    const done = typed ? ` ${Math.round((typed / (legacy + typed)) * 100)}% typed` : '';
    console.info(`  ${String(legacy).padStart(4)} legacy ${String(typed).padStart(3)} typed  ${area}${done}`);
  }

  const legacyFiles = production.filter(({ legacy }) => legacy);
  const injections = production.reduce((sum, { legacyInjections }) => sum + legacyInjections, 0);
  const typedInjections = production.reduce((sum, { typedInjections: count }) => sum + count, 0);
  console.info(
    `\n${legacyFiles.length} non-spec files still depend on ApiService, across ${areas.size} areas`
    + `\n${injections} inject it; the other ${legacyFiles.filter(({ legacyInjections }) => !legacyInjections).length}`
    + ' take it as a parameter (form configs, data providers)'
    + `\n${production.filter(({ typed }) => typed).length} are on TypedApiService (${typedInjections} injections)`
    + `\n${migratedApiPaths.length} paths are pinned against sliding back (scripts/api-migration-areas.mjs)`,
  );
}

function main(): void {
  const files = scan();

  if (process.argv.includes('--report')) {
    reportProgress(files);
    return;
  }

  report(
    'Migrated paths are back on the legacy API client',
    checkListedPaths(files),
    '\nEither the call site moved back — use TypedApiService and mockTypedApi() — or it moved\n'
    + 'somewhere else and scripts/api-migration-areas.mjs needs updating to follow it.\n'
    + 'See docs/devs/typed-api-client.md.',
  );

  report(
    'These have finished migrating and nothing stops them sliding back',
    unpinnedFinishedDirectories(files),
    '\nAdd each to `migratedApiPaths` in scripts/api-migration-areas.mjs. That is what turns a\n'
    + 'finished area into a path-scoped no-restricted-imports rule, so the next PR cannot\n'
    + 'reintroduce ApiService or mockApi there.',
  );

  const legacy = files.filter(({ isSpec, legacy: usesLegacy }) => !isSpec && usesLegacy).length;
  const typed = files.filter(({ isSpec, typed: usesTyped }) => !isSpec && usesTyped).length;
  console.info(
    `API client migration: ${typed} of ${legacy + typed} non-spec files typed `
    + `(${Math.round((typed / (legacy + typed)) * 100)}%), ${migratedApiPaths.length} paths pinned. `
    + 'Run `yarn check-api-migration --report` for the breakdown by area.',
  );
}

main();
