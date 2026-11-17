/**
 * A pool for the pool devices page, plus the dedup vdev pool, `pool.ddt_prune` jobs, Auto TRIM and dedup table
 * quota (`pool.update`), over the API.
 *
 * Offlining a disk needs a vdev that survives it, so this is a two-disk mirror, not `ensurePoolPresent`'s stripe;
 * spares and replacements need a third unused disk. Every test changes the topology, so the pool is the spec's
 * own, never the shared worker-scoped one.
 */
import type { QueryEntity } from '@truenas/api-client';
import { firstValueFrom, timeout } from 'rxjs';
import { runCommandOnAppliance } from './cron';
import { listDisks } from './disks';
import { readPoolTopology, type TopologyVdev } from './pool';
import { findPool, getSelectableDisks, type UnusedDisk } from './storage';
import type { E2eApiClient, E2eApiDirectory } from '../support/api/client';
import { runJob } from '../support/jobs';
import { readTimeoutMs } from '../support/timeouts';

type PoolEntry = QueryEntity<E2eApiDirectory['call'], 'pool.query'>;

/** A disk in the pool's topology, as `pool.query` reports it. */
export interface PoolDevice {
  /** `sdb`. Null for a disk middleware cannot find. */
  disk: string | null;
  guid: string;
  /** `ONLINE`, `OFFLINE`, `DEGRADED`, … */
  status: string;
}

const poolCreateTimeoutMs = 3 * 60_000;

/** `pool.update` setting a property answers once ZFS has it. */
const poolUpdateTimeoutMs = 60_000;

/** `pool.offline` and `pool.online` answer once ZFS has acted. */
const deviceStateTimeoutMs = 60_000;

/** Eight 128 KiB records, each its own dedup table entry. */
const dedupSeedBytes = 1024 * 1024;

/**
 * Builds a two-disk mirror by name, if it is not already there.
 *
 * The first disk the wizard's inventory lists, in `disk.details` order rather than
 * the wizard's size order, and another of the same type and size, since a mirror
 * of unlike disks is not one an admin could build there. The caller owns the removal,
 * through `ensurePoolAbsent`, and it has to be unconditional: the pool holds two
 * disks, and `fresh-install` needs nine alike.
 */
export async function ensureMirrorPoolPresent(client: E2eApiClient, name: string): Promise<void> {
  if (await findPool(client, name)) {
    return;
  }

  const disks = await getSelectableDisks(client);
  const [first] = disks;
  const second = disks.find((disk) => (
    disk !== first && disk.type === first?.type && disk.size === first?.size
  ));

  if (!first || !second) {
    throw new Error(
      `Pool "${name}" needs two unused disks of one type and size for its mirror, and the appliance `
      + 'does not have them, so the journey has no pool to act on.',
    );
  }

  await runJob(
    client,
    () => client.api.callAndGetJobId('pool.create', [{
      name,
      topology: { data: [{ type: 'MIRROR', disks: [first.devname, second.devname] }] },
    }]),
    {
      timeoutMs: poolCreateTimeoutMs,
      whatItCosts: `Pool "${name}" was not created, so the journey has no pool to act on.`,
    },
  );
}

/**
 * Builds a RAIDZ1 pool of three disks by name, and returns a fourth unused disk of the same type and size.
 *
 * All four come from the first type-and-size set with four, so Extend offers the fourth (it lists only disks at
 * least as large as the vdev's smallest). The caller destroys any existing pool first with `ensurePoolAbsent`,
 * and again afterwards, unconditionally; see `ensureMirrorPoolPresent`.
 */
export async function createRaidzPool(client: E2eApiClient, name: string): Promise<string> {
  const disks = await getSelectableDisks(client);
  const alike = disks
    .map((disk) => disks.filter((other) => other.type === disk.type && other.size === disk.size))
    .find((bucket) => bucket.length >= 4);
  const [first, second, third, fourth] = alike ?? [];

  if (!first || !second || !third || !fourth) {
    throw new Error(
      `Pool "${name}" needs four unused disks of one type and size, three for its RAIDZ1 vdev and one `
      + 'to extend it with, and the appliance does not have them, so the journey has no pool to act on.',
    );
  }

  await runJob(
    client,
    () => client.api.callAndGetJobId('pool.create', [{
      name,
      topology: { data: [{ type: 'RAIDZ1', disks: [first.devname, second.devname, third.devname] }] },
    }]),
    {
      timeoutMs: poolCreateTimeoutMs,
      whatItCosts: `Pool "${name}" was not created, so the journey has no pool to act on.`,
    },
  );

  return fourth.devname;
}

/**
 * What `ensureDevicePoolPresent` builds: `mirrors` (at least one) two-disk mirrors for data, and
 * one disk each for whichever of a cache, a log and a spare is asked for.
 */
export interface DevicePoolShape {
  mirrors: number;
  cache?: boolean;
  log?: boolean;
  spare?: boolean;
}

/**
 * Builds a pool of the given shape by name, if it is not already there, from
 * disks all of one type and size.
 *
 * The caller checks the count first with `requireUnusedDisks`, and owns the
 * removal through `ensurePoolAbsent`, unconditionally, for the reason given on
 * `ensureMirrorPoolPresent`.
 */
export async function ensureDevicePoolPresent(
  client: E2eApiClient,
  name: string,
  shape: DevicePoolShape,
): Promise<void> {
  if (await findPool(client, name)) {
    return;
  }

  const needed = shape.mirrors * 2 + Number(Boolean(shape.cache)) + Number(Boolean(shape.log))
    + Number(Boolean(shape.spare));
  const disks = await getSelectableDisks(client);
  const alike = disks
    .map((disk) => disks.filter((other) => other.type === disk.type && other.size === disk.size))
    .find((bucket) => bucket.length >= needed);

  if (!alike) {
    throw new Error(
      `Pool "${name}" needs ${needed} unused disks of one type and size, and the appliance does not `
      + 'have them, so the journey has no pool to act on.',
    );
  }

  const names = alike.slice(0, needed).map((disk) => disk.devname);
  const take = (count: number): string[] => names.splice(0, count);

  await runJob(
    client,
    () => client.api.callAndGetJobId('pool.create', [{
      name,
      topology: {
        // `pool.create` types `data` as a non-empty tuple, so the first mirror is spelled out.
        data: [
          { type: 'MIRROR' as const, disks: take(2) },
          ...Array.from({ length: shape.mirrors - 1 }, () => ({ type: 'MIRROR' as const, disks: take(2) })),
        ],
        ...(shape.cache ? { cache: [{ type: 'STRIPE' as const, disks: take(1) }] } : {}),
        ...(shape.log ? { log: [{ type: 'STRIPE' as const, disks: take(1) }] } : {}),
        ...(shape.spare ? { spares: take(1) } : {}),
      },
    }]),
    {
      timeoutMs: poolCreateTimeoutMs,
      whatItCosts: `Pool "${name}" was not created, so the journey has no pool to act on.`,
    },
  );
}

/**
 * Builds a pool by name with mirrored data and dedup vdevs (four alike disks) and deduplication on, and seeds
 * its dedup table, unless present. The caller removes it with `ensurePoolAbsent`, unconditionally.
 *
 * Prune shows only while the table has a size, so random bytes are written to the root dataset: compression
 * writes no block for zeros, and a short file lives in its block pointer. The size follows once synced, so the
 * caller polls `readDedupTableSize` and calls `addDedupSeed` again while it reads zero.
 */
export async function ensureDedupPoolPresent(client: E2eApiClient, name: string): Promise<void> {
  if (await findPool(client, name)) {
    return;
  }

  const disks = await getSelectableDisks(client);
  const [first] = disks;
  const alike = disks
    .filter((disk) => disk.type === first?.type && disk.size === first?.size)
    .map((disk) => disk.devname);

  if (alike.length < 4) {
    throw new Error(
      `Pool "${name}" needs four unused disks of one type and size, for a data mirror and a dedup `
      + `mirror, and the appliance has ${alike.length}, so the journey has no pool to act on.`,
    );
  }

  await runJob(
    client,
    () => client.api.callAndGetJobId('pool.create', [{
      name,
      deduplication: 'ON',
      topology: {
        data: [{ type: 'MIRROR', disks: alike.slice(0, 2) }],
        dedup: [{ type: 'MIRROR', disks: alike.slice(2, 4) }],
      },
    }]),
    {
      timeoutMs: poolCreateTimeoutMs,
      whatItCosts: `Pool "${name}" was not created, so the journey has no pool to act on.`,
    },
  );

  await addDedupSeed(client, name);
}

/**
 * Appends random bytes to the pool's seed file and syncs the pool, so the write is in the dedup table on return.
 *
 * ZFS clears its cached table size only while syncing a txg that changed the table, so a size read during that
 * sync can stay zero on an idle pool (a full minute once in CI). Another write and sync clears it, which is why a
 * caller still reading zero calls this again rather than waiting.
 */
export async function addDedupSeed(client: E2eApiClient, name: string): Promise<void> {
  await runCommandOnAppliance(client, {
    command: `head -c ${dedupSeedBytes} /dev/urandom >> /mnt/${name}/e2e-dedup-seed && /usr/sbin/zpool sync ${name}`,
    description: 'e2e dedup table seed file',
    whatItCosts: `pool "${name}" has nothing in its dedup table, so the card offers no Prune`,
  });
}

/**
 * The pool's dedup table size in bytes, as the Storage Health card reads it.
 * Middleware reports no size as `null`, which reads here as an empty table.
 */
export async function readDedupTableSize(client: E2eApiClient, name: string): Promise<number> {
  return (await getPool(client, name)).dedup_table_size ?? 0;
}

/**
 * The pool's Auto TRIM, as `pool.query` reports it: `on` or `off`. The client
 * types the property's value as `unknown`, so anything else reads as empty.
 */
export async function readAutotrim(client: E2eApiClient, name: string): Promise<string> {
  const { value } = (await getPool(client, name)).autotrim;
  return typeof value === 'string' ? value : '';
}

/**
 * Sets the pool's Auto TRIM as a precondition, or back as a restore, through
 * `pool.update`. Skipped when the pool already has that value, so a restore
 * that changes nothing starts no job.
 */
export async function setAutotrim(client: E2eApiClient, name: string, value: 'on' | 'off'): Promise<void> {
  const pool = await getPool(client, name);
  if (pool.autotrim.value === value) {
    return;
  }

  await runJob(
    client,
    () => client.api.callAndGetJobId('pool.update', [pool.id, { autotrim: value === 'on' ? 'ON' : 'OFF' }]),
    {
      timeoutMs: poolUpdateTimeoutMs,
      whatItCosts: `Auto TRIM on pool "${name}" was not set to ${value}.`,
    },
  );
}

/**
 * The pool's dedup table quota, as `pool.query` reports it: `auto`, `0` for none,
 * or a size in bytes as a string.
 */
export async function readDedupTableQuota(client: E2eApiClient, name: string): Promise<string | null> {
  return (await getPool(client, name)).dedup_table_quota ?? null;
}

/**
 * Sets the pool's dedup table quota as a precondition, through `pool.update`:
 * `'auto'`, or a custom size in bytes.
 */
export async function setDedupTableQuota(client: E2eApiClient, name: string, quota: 'auto' | number): Promise<void> {
  const { id } = await getPool(client, name);

  await runJob(
    client,
    () => client.api.callAndGetJobId('pool.update', [id, quota === 'auto'
      ? { dedup_table_quota: 'AUTO' }
      : { dedup_table_quota: 'CUSTOM', dedup_table_quota_value: quota }]),
    {
      timeoutMs: poolUpdateTimeoutMs,
      whatItCosts: `The dedup table quota on pool "${name}" was not set to ${quota}.`,
    },
  );
}

/** A `pool.ddt_prune` job, and what it was asked to prune. */
export interface DedupPruneRun {
  id: number;
  /** `SUCCESS`, `FAILED`, … */
  state: string;
  percentage: number | null;
  days: number | null;
}

/**
 * Every `pool.ddt_prune` job middleware remembers for one pool, by job id.
 *
 * Jobs outlive the pool, so a caller tells this run's apart by id. The pool is
 * the job's first argument's `pool_name`, beside the `percentage` or `days` the
 * dialog sent.
 */
export async function findDedupPruneRuns(client: E2eApiClient, name: string): Promise<DedupPruneRun[]> {
  const jobs = await firstValueFrom(
    client.api.query('core.get_jobs', [['method', '=', 'pool.ddt_prune']]).pipe(timeout(readTimeoutMs)),
  );

  return jobs
    .flatMap((job) => {
      const [params] = Array.isArray(job.arguments) ? job.arguments : [];
      const sent = (params ?? {}) as { pool_name?: string; percentage?: number | null; days?: number | null };
      if (sent.pool_name !== name) {
        return [];
      }

      return [{
        id: job.id,
        state: String(job.state),
        percentage: sent.percentage ?? null,
        days: sent.days ?? null,
      }];
    })
    .sort((a, b) => a.id - b.id);
}

async function getPool(client: E2eApiClient, name: string): Promise<PoolEntry> {
  // `query`, not `queryOne`. See "Talking to middleware" in `CLAUDE.md`.
  const [pool] = await firstValueFrom(
    client.api.query('pool.query', [['name', '=', name]]).pipe(timeout(readTimeoutMs)),
  );

  if (!pool) {
    throw new Error(`The appliance reports no pool named "${name}".`);
  }

  return pool;
}

/** The pool's first data vdev and the disks in it. */
export async function readMirror(
  client: E2eApiClient,
  name: string,
): Promise<{ guid: string; disks: PoolDevice[] }> {
  const [mirror] = (await readPoolTopology(client, name)).data;

  if (!mirror) {
    throw new Error(`Pool "${name}" reports no data vdev.`);
  }

  return { guid: mirror.guid, disks: mirror.children.map((item) => toDevice(item)) };
}

/** The pool's first data vdev, as `pool.query` reports it: its type and its disks. */
export async function readFirstDataVdev(
  client: E2eApiClient,
  name: string,
): Promise<{ type: string; guid: string; disks: PoolDevice[] }> {
  const [vdev] = (await readPoolTopology(client, name)).data;

  if (!vdev) {
    throw new Error(`Pool "${name}" reports no data vdev.`);
  }

  return { type: vdev.type, guid: vdev.guid, disks: vdev.children.map((item) => toDevice(item)) };
}

/**
 * The pool's data vdevs: each one's type and the disks in it. A vdev of one disk
 * is that disk, `DISK`, with no children, so it is listed as its own one disk.
 */
export async function readDataVdevs(
  client: E2eApiClient,
  name: string,
): Promise<{ type: string; guid: string; disks: PoolDevice[] }[]> {
  return (await readPoolTopology(client, name)).data.map((vdev) => ({
    type: vdev.type,
    guid: vdev.guid,
    disks: vdev.type === 'DISK' ? [toDevice(vdev)] : vdev.children.map((item) => toDevice(item)),
  }));
}

/** The pool's spares, in topology order. */
export async function listSpares(client: E2eApiClient, name: string): Promise<PoolDevice[]> {
  return (await readPoolTopology(client, name)).spare.map((item) => toDevice(item));
}

/**
 * Takes one of the pool's disks offline, or brings it back, by its `guid`, as a
 * precondition. The call answers once ZFS has acted; the pool's own status follows
 * it, so a caller polls `readPoolStatus` for that.
 */
export async function setPoolDiskState(
  client: E2eApiClient,
  name: string,
  guid: string,
  state: 'OFFLINE' | 'ONLINE',
): Promise<void> {
  const { id } = await getPool(client, name);

  if (state === 'OFFLINE') {
    await firstValueFrom(client.api.call('pool.offline', [id, { label: guid }]).pipe(timeout(deviceStateTimeoutMs)));
    return;
  }

  await firstValueFrom(client.api.call('pool.online', [id, { label: guid }]).pipe(timeout(deviceStateTimeoutMs)));
}

/**
 * An unused disk to replace one of the pool's disks with, by that disk's name.
 *
 * Of the same type and size, so the mirror stays one an admin could build, and the
 * first by device name, so the choice is the same from run to run on one appliance.
 */
export async function pickReplacementDisk(client: E2eApiClient, member: string): Promise<UnusedDisk> {
  const current = (await listDisks(client)).find((disk) => disk.name === member);
  const [replacement] = (await getSelectableDisks(client))
    .filter((disk) => disk.type === current?.type && disk.size === current?.size)
    .sort((a, b) => a.devname.localeCompare(b.devname));

  if (!current || !replacement) {
    throw new Error(
      `Disk "${member}" needs an unused disk of its own type and size to be replaced with, and the `
      + 'appliance does not have one, so there is nothing to pick in the Replace dialog.',
    );
  }

  return replacement;
}

/** The pool's own status: `ONLINE`, or `DEGRADED` while a member is offline. */
export async function readPoolStatus(client: E2eApiClient, name: string): Promise<string> {
  return (await getPool(client, name)).status;
}

function toDevice(item: TopologyVdev): PoolDevice {
  return { disk: item.disk ?? null, guid: item.guid, status: item.status };
}
