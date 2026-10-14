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

/**
 * Builds a two-disk mirror by name, if it is not already there.
 *
 * Two disks of the first type and size the wizard would offer, so that a mirror
 * of them is what an admin could have built by hand. The caller owns the removal,
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
  const pool = await getPool(client, name);
  const [mirror] = pool.topology?.data ?? [];

  if (!mirror) {
    throw new Error(`Pool "${name}" reports no data vdev.`);
  }

  return { guid: mirror.guid, disks: mirror.children.map((item) => toDevice(item)) };
}

/** The pool's spares, in topology order. */
export async function listSpares(client: E2eApiClient, name: string): Promise<PoolDevice[]> {
  const pool = await getPool(client, name);

  return (pool.topology?.spare ?? []).map((item) => toDevice(item));
}

/** The pool's own status: `ONLINE`, or `DEGRADED` while a member is offline. */
export async function readPoolStatus(client: E2eApiClient, name: string): Promise<string> {
  return (await getPool(client, name)).status;
}

function toDevice(item: { disk?: string | null; guid: string; status: string }): PoolDevice {
  return { disk: item.disk ?? null, guid: item.guid, status: item.status };
}
