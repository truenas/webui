/**
 * A pool for journeys that merely need one, plus pool topology readback, over the API.
 *
 * Uses an existing pool when there is one (a developer's box), else builds a one-disk pool from an unused disk
 * (CI) and exports it at the end; building through the wizard is `fresh-install`'s story. Exposed as the
 * worker-scoped `pool` fixture in `support/fixtures.ts`, so a worker builds it once.
 */
import { firstValueFrom, timeout } from 'rxjs';
import { ensurePoolAbsent, findPool, getSelectableDisks } from './storage';
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

/** One entry of a pool's topology, as `pool.query` reports it: a vdev, or a disk inside one. */
export interface TopologyVdev {
  /** `MIRROR`, `RAIDZ1`, … for a vdev. `DISK` for a disk, including a vdev of one disk. */
  type: string;
  name: string;
  guid: string;
  /** `ONLINE`, `OFFLINE`, `DEGRADED`, … */
  status: string;
  /** `sdb` on a disk. Null for a disk middleware cannot find. */
  disk?: string | null;
  /** A vdev's disks. Empty on a disk. */
  children: TopologyVdev[];
}

/** A pool's topology, every category present: one middleware leaves out reads as empty. */
export interface PoolTopology {
  data: TopologyVdev[];
  log: TopologyVdev[];
  cache: TopologyVdev[];
  spare: TopologyVdev[];
  special: TopologyVdev[];
  dedup: TopologyVdev[];
}

/** The topology of the pool named `name`. Throws when there is no such pool. */
export async function readPoolTopology(client: E2eApiClient, name: string): Promise<PoolTopology> {
  // `query`, not `queryOne`. See "Talking to middleware" in `CLAUDE.md`.
  const [pool] = await firstValueFrom(
    client.api.query('pool.query', [['name', '=', name]]).pipe(timeout(readTimeoutMs)),
  );

  if (!pool) {
    throw new Error(`The appliance reports no pool named "${name}".`);
  }

  // The API client types a pool's topology entries only as `unknown`, so the
  // narrowing has to happen here.
  const topology = pool.topology as unknown as Partial<PoolTopology> | null | undefined;

  return {
    data: topology?.data ?? [],
    log: topology?.log ?? [],
    cache: topology?.cache ?? [],
    spare: topology?.spare ?? [],
    special: topology?.special ?? [],
    dedup: topology?.dedup ?? [],
  };
}

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
 * A pool for datasets to live under, by name: an existing one if any (exporting a developer's pool is not a
 * precondition), else `e2e_shared_tank` built from one unused disk.
 *
 * `onBuild` fires *before* `pool.create` starts, so the caller records ownership before the job: the job can
 * land and still throw here (timeout, socket dropped while middleware restarts, interrupted run), and a pool
 * teardown skipped would hold its disks and starve every later run.
 */
async function providePool(client: E2eApiClient, onBuild: () => void): Promise<string> {
  const existing = await findOnlinePool(client);
  if (existing) {
    return existing;
  }

  onBuild();
  await buildStripePool(
    client,
    suiteOwnedPoolName,
    'so there is nowhere to put the datasets.',
  );

  return suiteOwnedPoolName;
}

/**
 * Builds a one-disk striped pool by name, the one place topology, timeout and disk choice are decided.
 *
 * Striped and single-disk on purpose: its contents don't matter, and a wider pool would claim disks
 * `fresh-install` needs. `whatItCosts` completes "Pool X was not created, …" for both a job failure and
 * having no disk to build from.
 */
async function buildStripePool(
  client: E2eApiClient,
  name: string,
  whatItCosts: string,
): Promise<void> {
  // The wizard's own view of the inventory, so the disk chosen here is one the
  // UI would have offered too — see `getSelectableDisks` for what it excludes.
  const [disk] = await getSelectableDisks(client);

  if (!disk) {
    throw new Error(
      `The appliance has no unused disk to build pool "${name}" from, ${whatItCosts}`,
    );
  }

  await runJob(
    client,
    () => client.api.callAndGetJobId('pool.create', [{
      name,
      topology: { data: [{ type: 'STRIPE', disks: [disk.devname] }] },
    }]),
    {
      timeoutMs: poolCreateTimeoutMs,
      whatItCosts: `Pool "${name}" was not created, ${whatItCosts}`,
    },
  );
}

/**
 * Builds a pool of the spec's own, if absent, for journeys whose subject is *destroying* a pool.
 *
 * Those must not use the worker-scoped `pool`, shared by every spec in the worker: exporting it, or failing
 * partway, takes the rest of the run down. The caller's removal must be unconditional: `findOnlinePool`
 * prefers any pool over the suite's, so a leftover would be handed to a later spec and exported under it.
 */
export async function ensurePoolPresent(client: E2eApiClient, name: string): Promise<void> {
  // By name, not `findOnlinePool` — that answers "which pool should a spec
  // use", which is a different question and would report this one present
  // whenever any other pool was.
  if (await findPool(client, name)) {
    return;
  }

  await buildStripePool(client, name, 'so the journey has no pool to act on.');
}

/**
 * Whether a pool is the suite's to export: the fixed name is reserved for it.
 *
 * By name rather than memory of building it, so a pool an interrupted run left behind is reclaimed next time
 * instead of adopted and leaked (on CI it is the only pool, so the next run uses it). Every other pool is left
 * alone, however the suite came to use it.
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
