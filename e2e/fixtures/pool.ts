/**
 * A pool for journeys that merely need one, over the API.
 *
 * Buckets, datasets and shares all live under a pool, but most journeys are not
 * about the pool — building one through the wizard is `fresh-install`'s story.
 * This provides one the cheap way: an existing pool when the appliance has one
 * (a developer's box), a one-disk pool built from an unused disk when it does
 * not (the CI appliance), and the export of the latter at the end.
 *
 * Exposed to specs as the worker-scoped `pool` fixture in `support/fixtures.ts`,
 * so a worker builds it once however many specs ask.
 */
import { firstValueFrom, timeout } from 'rxjs';
import { ensurePoolAbsent, getSelectableDisks } from './storage';
import type { E2eApiClient } from '../support/api/client';
import { runJob } from '../support/jobs';
import { readTimeoutMs } from '../support/timeouts';

/**
 * The pool the suite builds when the appliance has none. One disk, striped:
 * the datasets under it only have to exist. Reserved for the suite by name —
 * see `isSuiteOwnedPool`.
 */
export const suiteOwnedPoolName = 'e2e_shared_tank';

const poolCreateTimeoutMs = 3 * 60_000;

/**
 * The name of an online pool, or undefined when the appliance has none.
 *
 * A read only — the question cleanup asks, since a dataset can only be left
 * behind under a pool that exists. `providePool` is the one that builds.
 */
export async function findOnlinePool(client: E2eApiClient): Promise<string | undefined> {
  const pools = await firstValueFrom(
    client.api.query('pool.query', [['status', '=', 'ONLINE']]).pipe(timeout(readTimeoutMs)),
  );

  // Prefer somebody else's pool over the suite's own, so a leaked
  // `e2e_shared_tank` does not shadow the pool a developer meant the tests to
  // use. When it is the only pool it is used — and, being the suite's by name,
  // exported afterwards.
  return (pools.find((pool) => pool.name !== suiteOwnedPoolName) ?? pools[0])?.name;
}

/**
 * A pool for datasets to live under, by name.
 *
 * Prefers one that already exists: a developer's appliance has pools and often
 * no spare disk, and exporting somebody's pool is not a precondition. Only on
 * an appliance with none — the CI case — does this build `e2e_shared_tank`
 * from one unused disk.
 *
 * `onBuild` fires *before* `pool.create` is started, not after it is confirmed.
 * The caller uses it to record that this run is responsible for the pool, and
 * it has to be told before the job because the job can land and still throw
 * here — a timeout, a socket dropped while middleware restarts, a run
 * interrupted between the two. A pool recorded only on confirmation would be
 * skipped by teardown in exactly those cases, and a leaked pool holds its disks
 * and starves every later run.
 */
async function providePool(client: E2eApiClient, onBuild: () => void): Promise<string> {
  const existing = await findOnlinePool(client);
  if (existing) {
    return existing;
  }

  // The wizard's own view of the inventory, so the disk chosen here is one the
  // UI would have offered too — see `getSelectableDisks` for what it excludes.
  const [disk] = await getSelectableDisks(client);

  if (!disk) {
    throw new Error(
      'This journey needs a pool, and the appliance has neither an online pool nor an unused disk '
      + 'to build one from.',
    );
  }

  onBuild();
  await runJob(
    client,
    () => client.api.callAndGetJobId('pool.create', [{
      name: suiteOwnedPoolName,
      topology: { data: [{ type: 'STRIPE', disks: [disk.name] }] },
    }]),
    {
      timeoutMs: poolCreateTimeoutMs,
      whatItCosts: `Pool "${suiteOwnedPoolName}" was not created, so there is nowhere to put the datasets.`,
    },
  );

  return suiteOwnedPoolName;
}

/**
 * Whether a pool is the suite's to export: the fixed name is reserved for it.
 *
 * By name rather than by memory of having built it, so a pool left behind by
 * an interrupted run — created, never exported — is reclaimed the next time
 * the suite uses it, instead of being adopted as somebody else's and leaked for
 * good. (`findOnlinePool` prefers any other pool, so that is the next run on an
 * appliance where it is the only one — the CI case, which is also the only
 * case that builds it.) Every other pool is left alone, however the suite came
 * to use it.
 */
function isSuiteOwnedPool(name: string): boolean {
  return name === suiteOwnedPoolName;
}

/**
 * The pool bookkeeping a worker needs, in one place: which pool the journeys
 * got, and whether this run has to export it afterwards.
 *
 * Responsibility is recorded the moment a build is decided on (before the job,
 * so an interrupted build is still exported) or when the suite's own pool is
 * adopted from a previous run.
 */
export function poolLifecycle(): {
  provide: (client: E2eApiClient) => Promise<string>;
  release: (client: E2eApiClient, keepTestData: boolean) => Promise<void>;
} {
  let owned = false;

  return {
    provide: async (client) => {
      const name = await providePool(client, () => {
        owned = true;
      });
      owned ||= isSuiteOwnedPool(name);
      return name;
    },
    release: async (client, keepTestData) => {
      if (!owned) {
        return;
      }
      if (keepTestData) {
        console.warn(`TN_KEEP_TEST_DATA=1 — leaving pool "${suiteOwnedPoolName}".`);
        return;
      }
      await ensurePoolAbsent(client, suiteOwnedPoolName);
    },
  };
}
