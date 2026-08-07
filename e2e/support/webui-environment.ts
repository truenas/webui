/**
 * Reads the appliance webui itself is pointed at.
 *
 * In-tree, the suite and the dev server should agree on which machine they are
 * talking to without being told twice. `yarn ui remote -i <ip>` already writes
 * that address into `src/environments/environment.ts` for the dev server and
 * proxy, so the suite reads it from there rather than asking for `TN_HOST`
 * again — one command configures both.
 *
 * Deliberately parsed rather than imported. `environment.ts` is an Angular
 * source file (it imports `WebUiEnvironment` from a path only the app's
 * tsconfig resolves), so importing it would drag Angular's module resolution
 * into the Playwright runner for one string.
 *
 * Environment variables still win, so CI can point the suite at a machine
 * without touching the working tree — which matters, because `environment.ts`
 * is gitignored and CI has no reason to run `yarn ui remote`.
 *
 * This module is the one place the suite reaches into webui's source. When the
 * suite lived in its own repository that was forbidden outright (R2.10); in
 * tree it is the whole point, but it stays isolated so the coupling is visible.
 */
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

/** Repository root, two levels up from `e2e/support`. */
const repoRoot = join(import.meta.dirname, '..', '..');

const environmentFile = join(repoRoot, 'src', 'environments', 'environment.ts');

/** Placeholder `yarn ui remote` leaves when no remote has been set. */
const unsetRemote = '_REMOTE_';

/**
 * The host webui's dev server proxies to, or undefined when unset.
 *
 * Returns undefined rather than throwing when the file is missing:
 * `environment.ts` is generated and gitignored, so a fresh checkout that has
 * never run `yarn ui remote` simply has nothing to offer here.
 */
export function readWebuiRemote(): string | undefined {
  let contents: string;
  try {
    contents = readFileSync(environmentFile, 'utf8');
  } catch {
    return undefined;
  }

  const match = /remote:\s*'([^']*)'/.exec(contents);
  const remote = match?.[1];

  if (!remote || remote === unsetRemote) {
    return undefined;
  }

  return remote;
}
