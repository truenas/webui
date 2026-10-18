/**
 * A pool for the pool devices page: preconditions and readback, over the API.
 *
 * Taking a disk offline needs a vdev that survives losing it, so the pool here is
 * a two-disk mirror rather than the one-disk stripe `ensurePoolPresent` builds.
 * Adding a spare needs a third unused disk, which the wizard offers from the same
 * inventory, and so does replacing a disk. Every test here changes the pool's
 * topology, so the pool is its spec's own and never the worker-scoped one other
 * specs share.
 */
import type { QueryEntity } from '@truenas/api-client';
import { firstValueFrom, timeout } from 'rxjs';
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
 * Builds a RAIDZ1 pool of three disks by name, and returns the device name of a
 * fourth unused disk of the same type and size to extend it with.
 *
 * All four come from the first type-and-size set that has four, so the disk the
 * test adds is one the Extend dialog offers: it lists only disks at least as large
 * as the vdev's smallest. Nothing is checked for an existing pool: the caller
 * destroys it first with `ensurePoolAbsent`, and again afterwards, unconditionally,
 * for the reason given on `ensureMirrorPoolPresent`.
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
