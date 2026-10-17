/**
 * Periodic snapshot task preconditions, cleanup and readback, over the API.
 *
 * A task has no name. The card identifies a row by the dataset it snapshots,
 * so these helpers key on the dataset — and a spec gives every task a dataset
 * of its own. Creating, updating and deleting a task are plain calls, not jobs.
 */
import { expect } from '@playwright/test';
import type { CallResponse } from '@truenas/api-client';
import { firstValueFrom, timeout } from 'rxjs';
import type { SnapshotRetention } from './snapshots';
import type { E2eApiClient, E2eApiDirectory } from '../support/api/client';
import { readTimeoutMs, slowCallTimeoutMs } from '../support/timeouts';

/** A periodic snapshot task as middleware reports it, with its id narrowed — see `GroupRecord`. */
type SnapshotTaskEntry = Extract<CallResponse<E2eApiDirectory, 'pool.snapshottask.query'>, unknown[]>[number];

export type SnapshotTaskRecord = SnapshotTaskEntry & { id: number };

/** The crontab fields middleware stores a schedule as, before the Begin/End window. */
export interface SnapshotTaskSchedule {
  minute: string;
  hour: string;
  dom: string;
  month: string;
  dow: string;
}

/** The first of every month, which no preset the form offers can be confused with. */
export const monthlySchedule: SnapshotTaskSchedule = {
  minute: '0', hour: '0', dom: '1', month: '*', dow: '*',
};

/** The naming schema of a seeded task whose snapshots a spec seeds as well. */
export const ownedNamingSchema = 'e2e-target-%Y-%m-%d_%H-%M';

/**
 * A snapshot a task on {@link monthlySchedule} and {@link ownedNamingSchema}
 * owns without having run: middleware counts a snapshot as a task's when its
 * name parses with the naming schema at a minute the schedule fires on. It is
 * dated years ahead so that any removal date it is given is still in the
 * future, and nothing prunes the snapshot while a test reads it.
 */
export const ownedSnapshotName = 'e2e-target-2099-01-01_00-00';

/** A seeded task keeps snapshots for two weeks, so this is the day {@link ownedSnapshotName} is due to go. */
export const ownedSnapshotDestroyAt = Date.UTC(2099, 0, 15);

/** The name is in the appliance's local time, so the date can be up to a day either side in UTC. */
const oneDayMs = 24 * 60 * 60 * 1000;

/** Fails unless a retention falls on the day `destroyAt` names, {@link ownedSnapshotDestroyAt} by default. */
export function expectOwnedSnapshotDate(
  retention: SnapshotRetention | undefined,
  destroyAt = ownedSnapshotDestroyAt,
): void {
  const actual = retention?.destroyAt.getTime() ?? Number.NaN;
  expect(
    Math.abs(actual - destroyAt),
    `due at ${retention?.destroyAt.toISOString() ?? 'no date'}`,
  ).toBeLessThanOrEqual(oneDayMs);
}

/** Every task that snapshots this dataset. `query`, so none is an ordinary answer. */
export async function findSnapshotTasks(client: E2eApiClient, dataset: string): Promise<SnapshotTaskRecord[]> {
  const tasks = await firstValueFrom(
    client.api.query('pool.snapshottask.query', [['dataset', '=', dataset]]).pipe(timeout(readTimeoutMs)),
  );

  return tasks as SnapshotTaskRecord[];
}

/** The appliance's own record of the task on this dataset, or undefined. */
export async function findSnapshotTask(
  client: E2eApiClient,
  dataset: string,
): Promise<SnapshotTaskRecord | undefined> {
  const [task] = await findSnapshotTasks(client, dataset);
  return task;
}

/** How many periodic snapshot tasks the appliance holds, whoever made them. */
export async function countSnapshotTasks(client: E2eApiClient): Promise<number> {
  const tasks = await firstValueFrom(
    client.api.query('pool.snapshottask.query', []).pipe(timeout(readTimeoutMs)),
  );

  return tasks.length;
}

/**
 * Removes every task on this dataset, if any.
 *
 * Every, because middleware does not hold one task per dataset: a form saved
 * twice by a retried test leaves two.
 */
export async function ensureSnapshotTasksAbsent(client: E2eApiClient, dataset: string): Promise<void> {
  for (const task of await findSnapshotTasks(client, dataset)) {
    await firstValueFrom(
      client.api.call('pool.snapshottask.delete', [task.id, { fixate_removal_date: false }])
        .pipe(timeout(slowCallTimeoutMs)),
    );
  }
}

/**
 * Creates a task on this dataset, if it has none already: two weeks' retention,
 * not recursive, enabled unless `enabled` says otherwise.
 *
 * For the task an edit or a delete acts on, and for a bystander. Never for the
 * task under test in a create — that one goes through the form.
 */
export async function ensureSnapshotTaskPresent(
  client: E2eApiClient,
  {
    dataset,
    namingSchema,
    schedule,
    enabled = true,
  }: { dataset: string; namingSchema: string; schedule: SnapshotTaskSchedule; enabled?: boolean },
): Promise<void> {
  if (await findSnapshotTask(client, dataset)) {
    return;
  }

  await firstValueFrom(
    client.api.call('pool.snapshottask.create', [{
      dataset,
      recursive: false,
      exclude: [],
      lifetime_value: 2,
      lifetime_unit: 'WEEK',
      naming_schema: namingSchema,
      schedule: { ...schedule, begin: '00:00', end: '23:59' },
      allow_empty: true,
      enabled,
    }]).pipe(timeout(slowCallTimeoutMs)),
  );
}
