/**
 * A pool for the pool devices page: preconditions and readback, over the API.
 *
 * Taking a disk offline needs a vdev that survives losing it, so the pool here is
 * a two-disk mirror rather than the one-disk stripe `ensurePoolPresent` builds.
 * Adding a spare needs a third unused disk, which the wizard offers from the same
 * inventory. Both tests change the pool's topology, so the pool is this spec's own
 * and never the worker-scoped one other specs share.
 */
import type { QueryEntity } from '@truenas/api-client';
import { firstValueFrom, timeout } from 'rxjs';
import { readPoolTopology, type TopologyVdev } from './pool';
import { findPool, getSelectableDisks } from './storage';
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

/** `pool.offline` and `pool.online` answer once ZFS has acted. */
const deviceStateTimeoutMs = 60_000;

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
 * What `ensureDevicePoolPresent` builds: `mirrors` two-disk mirrors for data, and
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
        data: Array.from({ length: shape.mirrors }, () => ({ type: 'MIRROR' as const, disks: take(2) })),
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

/** The pool's own status: `ONLINE`, or `DEGRADED` while a member is offline. */
export async function readPoolStatus(client: E2eApiClient, name: string): Promise<string> {
  return (await getPool(client, name)).status;
}

function toDevice(item: TopologyVdev): PoolDevice {
  return { disk: item.disk ?? null, guid: item.guid, status: item.status };
}
