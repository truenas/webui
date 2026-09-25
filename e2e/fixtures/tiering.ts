/**
 * ZFS tiering preconditions and cleanup, over the API.
 *
 * Two kinds of state, handled differently:
 *
 * - **The tiering configuration** is global, like preferences: one row that every
 *   later test sees. With tiering on, share lists grow a Storage Tier column, the
 *   dataset form hides its special-vdev fields, and SMB shares stop following nested
 *   datasets. So {@link establishTierBaseline} writes a known state before each test
 *   and again after it, rather than restoring whatever it found.
 * - **The pool** tiered datasets live on needs a special vdev, which the shared
 *   `pool` fixture does not have and must not be given. {@link ensureTierPoolPresent}
 *   builds one of its own, and the caller removes it with `ensurePoolAbsent`.
 */
import type { CallResponse } from '@truenas/api-client';
import { firstValueFrom, timeout } from 'rxjs';
import { findPool, getSelectableDisks } from './storage';
import type { E2eApiClient, E2eApiDirectory } from '../support/api/client';
import { runJob } from '../support/jobs';
import { readTimeoutMs, slowCallTimeoutMs } from '../support/timeouts';

export type TierConfigEntry = CallResponse<E2eApiDirectory, 'zfs.tier.config'>;

/** What `zfs.tier.update` takes: the configuration without its row id. */
export type TierConfigValues = Omit<TierConfigEntry, 'id'>;

/**
 * The tiering configuration every tiering test starts and ends in: off, with
 * middleware's own defaults — what a fresh install reports.
 *
 * Not the tier form's defaults. The form seeds `max_concurrent_jobs` with 1 and
 * middleware with 2; the form patches over its seed with what it loads, so the
 * value a test sees is this one.
 */
export const tierBaseline: Readonly<TierConfigValues> = {
  enabled: false,
  max_concurrent_jobs: 2,
  max_used_percentage: 80,
  special_class_metadata_reserve_pct: 25,
};

/**
 * The pool tiered datasets live on. Reserved for the tiering specs by name.
 *
 * Must not outlive them: `findOnlinePool` prefers any pool over the suite's own,
 * so a leaked one would be handed to the next spec as its pool — and that spec
 * would then be running on a pool with a special vdev and tiering-shaped datasets.
 */
export const tierPoolName = 'e2e_tier_tank';

const poolCreateTimeoutMs = 3 * 60_000;

export async function readTierConfig(client: E2eApiClient): Promise<TierConfigEntry> {
  return firstValueFrom(client.api.call('zfs.tier.config').pipe(timeout(readTimeoutMs)));
}

/**
 * Writes the tiering configuration: the baseline, with any overrides on top.
 *
 * `zfs.tier.update` reloads the tiering daemon, and restarts it when
 * `max_concurrent_jobs` changes — hence the slow-call budget.
 */
export async function establishTierBaseline(
  client: E2eApiClient,
  overrides: Partial<TierConfigValues> = {},
): Promise<void> {
  await firstValueFrom(
    client.api
      .call('zfs.tier.update', [{ ...tierBaseline, ...overrides }])
      .pipe(timeout(slowCallTimeoutMs)),
  );
}

/**
 * Builds {@link tierPoolName}, if it is not already there: one data disk and one
 * special disk, both striped.
 *
 * The special vdev is the whole point. Middleware reports `tier: null` for every
 * dataset on a pool without one, and the UI hides everything tier-related on a
 * dataset whose `tier` is null — so on the shared pool there is nothing to click.
 * Striped because nothing stored here matters.
 *
 * It holds two disks for as long as it exists, and `fresh-install` needs nine alike
 * — every disk a nine-disk appliance has. So the caller removes it after its last
 * test, not at the end of the run.
 */
export async function ensureTierPoolPresent(client: E2eApiClient): Promise<void> {
  if (await findPool(client, tierPoolName)) {
    return;
  }

  const [data, special] = await getSelectableDisks(client);
  if (!data || !special) {
    throw new Error(
      `Pool "${tierPoolName}" needs two unused disks — one data, one special — and the `
      + 'appliance does not have them, so there is no pool for a tiered dataset to live on.',
    );
  }

  await runJob(
    client,
    () => client.api.callAndGetJobId('pool.create', [{
      name: tierPoolName,
      topology: {
        data: [{ type: 'STRIPE', disks: [data.devname] }],
        special: [{ type: 'STRIPE', disks: [special.devname] }],
      },
    }]),
    {
      timeoutMs: poolCreateTimeoutMs,
      whatItCosts: `Pool "${tierPoolName}" was not created, so there is no pool with a special vdev to tier on.`,
    },
  );
}

/**
 * A dataset name no earlier run has used.
 *
 * Fixed names are the suite's habit (see "Fixed names" in `docs/status.md`), and
 * here they are wrong. Middleware keys a rewrite job by dataset *name* and never
 * forgets one: a dataset created under a name that was migrated before — even after
 * the dataset was deleted, even after its pool was destroyed and rebuilt — comes back
 * as `REGULAR` carrying the old job, `COMPLETE`, targeting `PERFORMANCE`. Probed
 * against `27.0.0-MASTER+20260924-230159`. With a fixed name, the second run of the
 * no-migration test would open on a dataset the UI already calls migrated.
 *
 * Base 36 of the clock keeps the tree node's id short. Two calls in one
 * millisecond would collide, which serial execution (R3.4) does not produce.
 */
export function unusedDatasetName(prefix: string): string {
  return `${prefix}_${Date.now().toString(36)}`;
}
