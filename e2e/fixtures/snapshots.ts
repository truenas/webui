/**
 * Snapshot preconditions and cleanup, over the API.
 *
 * A snapshot is named `<dataset>@<name>`, and that full name is its id — to
 * middleware, to the list's row tags, and to everything here.
 *
 * Cleanup has an order of its own. A snapshot cannot be destroyed while it is
 * held or while a clone depends on it, and a dataset cannot be destroyed while
 * one of its snapshots is in either state — so a spec that leaves a hold or a
 * clone behind leaves a dataset `ensureDatasetAbsent` cannot remove.
 * {@link ensureSnapshotsAbsent} releases holds for that reason; clones are
 * datasets, and are the spec's to remove first.
 */
import type { CallResponse } from '@truenas/api-client';
import { firstValueFrom, timeout } from 'rxjs';
import type { E2eApiClient, E2eApiDirectory } from '../support/api/client';
import { readTimeoutMs, slowCallTimeoutMs } from '../support/timeouts';

type SnapshotEntry = Extract<CallResponse<E2eApiDirectory, 'pool.snapshot.query'>, unknown[]>[number];

/** A snapshot as middleware reports it, with the fields these specs read narrowed. */
export type SnapshotRecord = SnapshotEntry & {
  name: string;
  dataset: string;
  snapshot_name: string;
  holds?: Record<string, unknown>;
};

/** The full name of a snapshot, which is also its id. */
export function snapshotId(dataset: string, name: string): string {
  return `${dataset}@${name}`;
}

/** Every snapshot of exactly this dataset — not of its children. */
export async function listSnapshots(client: E2eApiClient, dataset: string): Promise<SnapshotRecord[]> {
  const snapshots = await firstValueFrom(
    client.api
      .query('pool.snapshot.query', [['dataset', '=', dataset]], { extra: { holds: true } })
      .pipe(timeout(readTimeoutMs)),
  );

  return snapshots as SnapshotRecord[];
}

/**
 * The appliance's own record of a snapshot, or undefined.
 *
 * Carries `holds`, which is the only way to see one: the list does not show a
 * hold, and the details row shows it as a tick box that moves on click whether
 * or not anything was written.
 */
export async function findSnapshot(
  client: E2eApiClient,
  dataset: string,
  name: string,
): Promise<SnapshotRecord | undefined> {
  // `query`, not `queryOne` — absence is an ordinary answer here.
  const [snapshot] = await firstValueFrom(
    client.api
      .query('pool.snapshot.query', [['id', '=', snapshotId(dataset, name)]], { extra: { holds: true } })
      .pipe(timeout(readTimeoutMs)),
  );

  return snapshot as SnapshotRecord | undefined;
}

/** Whether a snapshot the appliance has is held. False for one it does not have. */
export async function isSnapshotHeld(client: E2eApiClient, dataset: string, name: string): Promise<boolean> {
  const snapshot = await findSnapshot(client, dataset, name);

  return Object.keys(snapshot?.holds ?? {}).length > 0;
}

/**
 * Takes a snapshot, if the dataset does not have one by that name.
 *
 * For the snapshot a test acts *on*. Never for one a test is about taking —
 * that one goes through the form.
 */
export async function ensureSnapshotPresent(client: E2eApiClient, dataset: string, name: string): Promise<void> {
  if (await findSnapshot(client, dataset, name)) {
    return;
  }

  await firstValueFrom(
    client.api.call('pool.snapshot.create', [{ dataset, name }]).pipe(timeout(slowCallTimeoutMs)),
  );
}

/**
 * Removes every snapshot of a dataset, releasing any hold first.
 *
 * Tolerates a dataset that is not there: a spec's `beforeEach` runs this before
 * it has made anything.
 */
export async function ensureSnapshotsAbsent(client: E2eApiClient, dataset: string): Promise<void> {
  for (const snapshot of await listSnapshots(client, dataset)) {
    if (Object.keys(snapshot.holds ?? {}).length > 0) {
      await firstValueFrom(
        client.api.call('pool.snapshot.release', [snapshot.name]).pipe(timeout(slowCallTimeoutMs)),
      );
    }

    await firstValueFrom(
      client.api.call('pool.snapshot.delete', [snapshot.name]).pipe(timeout(slowCallTimeoutMs)),
    );
  }
}

/**
 * Creates a directory inside a dataset.
 *
 * The cheapest change to a dataset's *contents* the API offers, and contents
 * are what a rollback is about: properties and child datasets survive one, so
 * neither can show that it happened.
 */
export async function ensureDirectoryPresent(client: E2eApiClient, path: string): Promise<void> {
  if (await directoryExists(client, path)) {
    return;
  }

  await firstValueFrom(
    client.api.call('filesystem.mkdir', [{ path }]).pipe(timeout(slowCallTimeoutMs)),
  );
}

/** Whether a directory exists, asked of its parent so that absence is an answer and not an error. */
export async function directoryExists(client: E2eApiClient, path: string): Promise<boolean> {
  const separator = path.lastIndexOf('/');
  const entries = await firstValueFrom(
    client.api
      .call('filesystem.listdir', [path.slice(0, separator), [['name', '=', path.slice(separator + 1)]]])
      .pipe(timeout(readTimeoutMs)),
  );

  // Unfiltered by `count` or `get`, so this is the list form of the union.
  return Array.isArray(entries) && entries.length > 0;
}
