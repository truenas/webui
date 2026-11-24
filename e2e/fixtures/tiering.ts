/**
 * ZFS tiering preconditions and cleanup, over the API.
 *
 * The tiering config is global (share lists gain a Storage Tier column, the dataset form hides special-vdev
 * fields, SMB shares stop following nested datasets), so {@link establishTierBaseline} writes a known state before
 * and after each test. Tiered datasets need a special vdev the shared `pool` must not get, so
 * {@link ensureTierPoolPresent} builds its own pool, removed with `ensurePoolAbsent`. {@link seedMigrationData}
 * writes enough data for a migration to still be running when a test reaches it.
 */
import type { CallResponse } from '@truenas/api-client';
import { firstValueFrom, timeout } from 'rxjs';
import { ensureCronjobAbsent, ensureCronjobPresent, findCronjob } from './cron';
import {
  datasetMountPath, findDataset, findPool, getSelectableDisks,
} from './storage';
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
 * Writes the tiering configuration (baseline plus overrides) unless the appliance already holds exactly that.
 *
 * The skip is load-bearing: every `zfs.tier.update` reloads the daemon, and pool create/export restart it via the
 * system dataset. Too much churn and systemd stops starting it (`start-limit-hit`); its socket is gone and every
 * migration fails with `[Errno 2] No such file or directory`. Writing only real changes limits the suite's churn.
 */
export async function establishTierBaseline(
  client: E2eApiClient,
  overrides: Partial<TierConfigValues> = {},
): Promise<void> {
  const wanted = { ...tierBaseline, ...overrides };
  const current = await readTierConfig(client);
  const unchanged = (Object.keys(wanted) as (keyof TierConfigValues)[])
    .every((key) => current[key] === wanted[key]);
  if (unchanged) {
    return;
  }

  await firstValueFrom(
    client.api.call('zfs.tier.update', [wanted]).pipe(timeout(slowCallTimeoutMs)),
  );
}

/**
 * Builds {@link tierPoolName} unless present: one data disk and one special disk, both striped.
 *
 * Without a special vdev middleware reports `tier: null` and the UI hides everything tier-related. It holds two
 * disks while it exists, and `fresh-install` needs nine alike, so the caller removes it after its last test.
 * Build it once per spec file, not per test: create and export restart the tiering daemon (`establishTierBaseline`).
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
 * A dataset name no earlier run has used, unlike the suite's usual fixed names ("Fixed names" in `docs/status.md`).
 *
 * Middleware keys rewrite jobs by dataset *name* forever: a reused name, even after deleting the dataset or
 * rebuilding the pool, comes back `REGULAR` with the old `COMPLETE` job (probed on 27.0.0-MASTER+20260924-230159),
 * so the UI would call it migrated. Base 36 keeps the node id short; same-millisecond calls would collide, which
 * serial execution (R3.4) does not produce.
 */
export function unusedDatasetName(prefix: string): string {
  return `${prefix}_${Date.now().toString(36)}`;
}

/**
 * How much {@link seedMigrationData} writes: 4 GiB of random bytes, as 262,144 files of 16 KiB.
 *
 * Sized so a migration still runs when a test reaches Cancel a few seconds after Apply. Random because the pool
 * compresses; small files because the rewrite pays per file. Fits the 10 GB tier disks either side. CI run
 * 39091322942 migrated 2 GiB in 5 seconds, so size alone isn't enough; see {@link migrationSeedCompression}.
 */
const migrationSeedBytes = 4 * 1024 ** 3;
const migrationSeedFileBytes = 16 * 1024;

/**
 * The compression {@link seedMigrationData} leaves the dataset on, once the seed is written.
 *
 * A rewrite writes every block again with the dataset's current properties, so it compresses the
 * whole seed again. gzip-9 is slow and, unlike zstd's higher levels and lz4, does not give up
 * early on incompressible data, so it makes every block of the move cost CPU. It is set after
 * the write, so the seed itself is not slowed.
 */
const migrationSeedCompression = 'GZIP-9';

/** Writing the seed is bounded by the appliance's disk, not by middleware. */
const migrationSeedTimeoutMs = 5 * 60_000;

/**
 * The shell command {@link seedMigrationData} runs for `dataset`. Exported so a teardown can remove
 * its cron job by command, which is how a cron job is found.
 *
 * One pipeline, so the seed is never on disk twice: `split` cuts the stream into files as it
 * arrives.
 */
export function migrationSeedCommand(dataset: string): string {
  return `head -c ${migrationSeedBytes} /dev/urandom`
    + ` | split -b ${migrationSeedFileBytes} -a 5 - ${datasetMountPath(dataset)}/seed_`;
}

/**
 * Fills `dataset` with enough data that migrating it takes a while, and waits for the write to finish.
 *
 * An empty dataset migrates at once, so a test about a running migration needs something to move.
 * The API writes no file contents (see `writeFileOnAppliance` in `fixtures/cloud-sync.ts`), so a
 * one-off cron job runs the write and is removed again. Then the dataset is switched to
 * {@link migrationSeedCompression}, which is what makes moving it slow.
 */
export async function seedMigrationData(client: E2eApiClient, dataset: string): Promise<void> {
  const command = migrationSeedCommand(dataset);
  await ensureCronjobPresent(client, {
    command,
    description: 'e2e tier migration seed',
    schedule: {
      minute: '0', hour: '0', dom: '1', month: '1', dow: '*',
    },
  });

  try {
    const cronjob = await findCronjob(client, command);
    if (!cronjob) {
      throw new Error(`the cron job seeding ${dataset} was not created.`);
    }

    await runJob(
      client,
      () => client.api.callAndGetJobId('cronjob.run', [cronjob.id]),
      {
        timeoutMs: migrationSeedTimeoutMs,
        whatItCosts: `${dataset} was not filled, so migrating it would finish before Cancel could be pressed`,
      },
    );
  } finally {
    await ensureCronjobAbsent(client, command);
  }

  await firstValueFrom(
    client.api.call('pool.dataset.update', [dataset, { compression: migrationSeedCompression }])
      .pipe(timeout(slowCallTimeoutMs)),
  );
}

/**
 * Cancels `dataset`'s migration if it is still running or queued.
 *
 * For teardown: a test that fails before its own Cancel leaves the tiering daemon rewriting a
 * dataset that is about to be deleted.
 */
export async function ensureMigrationStopped(client: E2eApiClient, dataset: string): Promise<void> {
  const job = (await findDataset(client, dataset))?.tier?.tier_job;
  if (!job || (job.status !== 'RUNNING' && job.status !== 'QUEUED')) {
    return;
  }

  await firstValueFrom(
    client.api.call('zfs.tier.rewrite_job_cancel', [{ tier_job_id: job.tier_job_id }])
      .pipe(timeout(slowCallTimeoutMs)),
  );
}
