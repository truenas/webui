/**
 * Disks: preconditions, cleanup and readback, over the API.
 *
 * A disk cannot be created or deleted, so the edit test works like the config
 * specs (`fixtures/email.ts`). It starts from a fixed baseline and writes that
 * baseline back afterwards. The baseline is what middleware gives a disk it has
 * never been told anything about.
 *
 * The wipe test needs a disk with something on it that a wipe removes and the
 * API can see. A pool exported without `destroy` is that: the disk stays out of
 * every pool and `disk.details` still reports the pool on it as `exported_zpool`.
 * Such a disk is offered nowhere else. `getSelectableDisks` leaves it out, so a
 * disk left in that state is one fewer for every later run. Teardown wipes it.
 */
import type { QueryEntity } from '@truenas/api-client';
import { firstValueFrom, timeout } from 'rxjs';
import { ensurePoolPresent } from './pool';
import { ensurePoolAbsent, findPool, getSelectableDisks } from './storage';
import type { DiskPowerLevel, DiskStandby } from '../locators/disks';
import type { E2eApiClient, E2eApiDirectory } from '../support/api/client';
import { runJob } from '../support/jobs';
import { readTimeoutMs, slowCallTimeoutMs } from '../support/timeouts';

/** One row of `disk.query`, typed from the client's own directory. */
export type DiskEntry = QueryEntity<E2eApiDirectory['call'], 'disk.query'>;

/** The part of a disk the Edit Disk form changes, less the SED password. */
export interface DiskSettings {
  description: string;
  hddstandby: DiskStandby;
  advpowermgmt: DiskPowerLevel;
}

/** Middleware's defaults for a disk. */
export const diskBaseline: DiskSettings = {
  description: '',
  hddstandby: 'ALWAYS ON',
  advpowermgmt: 'DISABLED',
};

/** A pool export or a wipe of one 10GB disk. Both are quick. Give them room anyway. */
const diskJobTimeoutMs = 3 * 60_000;

/** Every disk the appliance reports, boot disk included. */
export async function listDisks(client: E2eApiClient): Promise<DiskEntry[]> {
  return firstValueFrom(client.api.query('disk.query', []).pipe(timeout(readTimeoutMs)));
}

async function getDisk(client: E2eApiClient, name: string): Promise<DiskEntry> {
  // `query`, not `queryOne`. See "Talking to middleware" in `CLAUDE.md`.
  const [disk] = await firstValueFrom(
    client.api.query('disk.query', [['name', '=', name]]).pipe(timeout(readTimeoutMs)),
  );

  if (!disk) {
    throw new Error(`The appliance reports no disk named "${name}".`);
  }

  return disk;
}

/**
 * The disks in no pool, by name.
 *
 * In no pool so that nothing else the suite does leans on them, and by name so
 * the choice is the same from run to run on one appliance.
 */
async function unusedDiskNames(client: E2eApiClient): Promise<string[]> {
  return (await getSelectableDisks(client))
    .map(({ name }) => name)
    .sort((a, b) => a.localeCompare(b));
}

/** A disk for a test to edit: the first of {@link unusedDiskNames}. */
export async function pickUnusedDisk(client: E2eApiClient): Promise<string> {
  const [disk] = await unusedDiskNames(client);

  if (!disk) {
    throw new Error('The appliance has no unused disk, so there is no disk this test can edit.');
  }

  return disk;
}

/** The first `count` of {@link unusedDiskNames}, for a test that edits several disks at once. */
export async function pickUnusedDisks(client: E2eApiClient, count: number): Promise<string[]> {
  const disks = (await unusedDiskNames(client)).slice(0, count);

  if (disks.length < count) {
    throw new Error(
      `The appliance has ${disks.length} unused disk(s), and this test needs ${count} that no pool holds.`,
    );
  }

  return disks;
}

/** The disk's editable settings as the appliance holds them. */
export async function readDiskSettings(client: E2eApiClient, name: string): Promise<DiskSettings> {
  const disk = await getDisk(client, name);

  return {
    description: disk.description ?? '',
    hddstandby: disk.hddstandby as DiskStandby,
    advpowermgmt: disk.advpowermgmt as DiskPowerLevel,
  };
}

/** Writes the given settings over a disk's own. */
export async function writeDiskSettings(client: E2eApiClient, name: string, settings: DiskSettings): Promise<void> {
  const { identifier } = await getDisk(client, name);

  await firstValueFrom(
    client.api.call('disk.update', [identifier, settings]).pipe(timeout(slowCallTimeoutMs)),
  );
}

/** Writes the baseline over a disk's settings. Used before and after each test. */
export async function resetDiskSettings(client: E2eApiClient, name: string): Promise<void> {
  await writeDiskSettings(client, name, diskBaseline);
}

interface DetailsDisk {
  name: string;
  /** Set when the disk still carries a pool that was exported. */
  exported_zpool?: string;
}

/**
 * Disks carrying an exported pool by that pool's name.
 *
 * Both halves of `disk.details` are read, as the Disks page reads them. Which half
 * a disk with an exported pool lands in is middleware's choice.
 */
export async function findDisksCarryingExportedPool(client: E2eApiClient, pool: string): Promise<string[]> {
  // Narrowed by hand, as in `getSelectableDisks`: the client types this call
  // only as `unknown[] | Record<string, unknown>`.
  const details = await firstValueFrom(
    client.api.call('disk.details', []).pipe(timeout(slowCallTimeoutMs)),
  ) as unknown as { unused?: DetailsDisk[]; used?: DetailsDisk[] };

  return [...(details.unused ?? []), ...(details.used ?? [])]
    .filter((disk) => disk.exported_zpool === pool)
    .map((disk) => disk.name);
}

/**
 * A disk carrying the named pool, exported, by disk name.
 *
 * Builds a one-disk pool and exports it with `destroy: false`, so the pool's
 * labels stay on the disk. A disk a previous run left in that state is used as
 * it is.
 */
export async function ensureDiskWithExportedPool(client: E2eApiClient, pool: string): Promise<string> {
  const [carrying] = await findDisksCarryingExportedPool(client, pool);
  if (carrying) {
    return carrying;
  }

  await ensurePoolPresent(client, pool);
  const built = await findPool(client, pool);
  if (!built) {
    throw new Error(`Pool "${pool}" was built and is not there, so there is no pool to export.`);
  }

  await runJob(
    client,
    () => client.api.callAndGetJobId('pool.export', [
      built.id,
      { cascade: true, restart_services: true, destroy: false },
    ]),
    {
      timeoutMs: diskJobTimeoutMs,
      whatItCosts: `Pool "${pool}" was not exported, so there is no disk carrying an exported pool to wipe.`,
    },
  );

  const [disk] = await findDisksCarryingExportedPool(client, pool);
  if (!disk) {
    throw new Error(
      `Pool "${pool}" was exported, but \`disk.details\` reports no disk carrying it. `
      + 'The wipe test has nothing to wipe.',
    );
  }

  return disk;
}

/**
 * Leaves no trace of the named pool: exported and destroyed if it is still
 * imported, and every disk still carrying it wiped.
 *
 * In that order. Destroying an imported pool wipes its disks itself, and only a
 * disk carrying the pool *exported* is left for the second step.
 */
export async function ensureExportedPoolGone(client: E2eApiClient, pool: string): Promise<void> {
  await ensurePoolAbsent(client, pool);

  for (const disk of await findDisksCarryingExportedPool(client, pool)) {
    await runJob(
      client,
      () => client.api.callAndGetJobId('disk.wipe', [disk, 'QUICK']),
      {
        timeoutMs: diskJobTimeoutMs,
        whatItCosts:
          `Disk "${disk}" still carries exported pool "${pool}", so the pool wizard will not offer it `
          + 'and later runs are one disk short.',
      },
    );
  }
}
