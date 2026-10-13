/**
 * Periodic snapshot task preconditions, cleanup and readback, over the API.
 *
 * A task has no name. The card identifies a row by the dataset it snapshots,
 * so these helpers key on the dataset — and a spec gives every task a dataset
 * of its own. Creating, updating and deleting a task are plain calls, not jobs.
 */
import type { CallResponse } from '@truenas/api-client';
import { firstValueFrom, timeout } from 'rxjs';
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
 * not recursive, enabled.
 *
 * For the task an edit or a delete acts on, and for a bystander. Never for the
 * task under test in a create — that one goes through the form.
 */
export async function ensureSnapshotTaskPresent(
  client: E2eApiClient,
  { dataset, namingSchema, schedule }: { dataset: string; namingSchema: string; schedule: SnapshotTaskSchedule },
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
      enabled: true,
    }]).pipe(timeout(slowCallTimeoutMs)),
  );
}
