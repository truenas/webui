/**
 * Reads the appliance webui is pointed at, so `TN_HOST=auto` reuses what `yarn ui remote -i <ip>` wrote to
 * `src/environments/environment.ts`. Opt-in, never a default: the suite destroys pools (see `config.ts`).
 * Parsed rather than imported, because importing would drag Angular's tsconfig resolution into the runner.
 * Environment variables still win, so CI needs neither the gitignored file nor `yarn ui remote`.
 * The one place the suite reaches into webui's source (R2.10); kept isolated so the coupling is visible.
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
