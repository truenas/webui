/**
 * Replication task preconditions, cleanup and readback, over the API.
 *
 * A task is named, and middleware holds names unique, so these helpers key on
 * the name. Creating and deleting a task are plain calls; running one is a job,
 * `replication.run`.
 *
 * Every task made here is local: both ends on this appliance, so `LOCAL`
 * transport and no SSH connection. It replicates snapshots matching
 * {@link replicationNamingSchema} — the wizard's own default — and never runs on
 * a schedule, so nothing fires between a test and its teardown.
 */
import type { CallResponse } from '@truenas/api-client';
import { firstValueFrom, timeout } from 'rxjs';
import type { E2eApiClient, E2eApiDirectory } from '../support/api/client';
import { readTimeoutMs, slowCallTimeoutMs } from '../support/timeouts';

/** A replication task as middleware reports it, with its id narrowed — see `GroupRecord`. */
type ReplicationTaskEntry = Extract<CallResponse<E2eApiDirectory, 'replication.query'>, unknown[]>[number];

export type ReplicationTaskRecord = ReplicationTaskEntry & { id: number };

/** The naming schema the wizard snapshots a local source with when it finds none to send. */
export const replicationNamingSchema = 'auto-%Y-%m-%d_%H-%M';

/** Every task with this name. `query`, so none is an ordinary answer. */
export async function findReplicationTasks(client: E2eApiClient, name: string): Promise<ReplicationTaskRecord[]> {
  const tasks = await firstValueFrom(
    client.api.query('replication.query', [['name', '=', name]]).pipe(timeout(readTimeoutMs)),
  );

  return tasks as ReplicationTaskRecord[];
}

/** The appliance's own record of the task with this name, or undefined. */
export async function findReplicationTask(
  client: E2eApiClient,
  name: string,
): Promise<ReplicationTaskRecord | undefined> {
  const [task] = await findReplicationTasks(client, name);
  return task;
}

/** How many replication tasks the appliance holds, whoever made them. */
export async function countReplicationTasks(client: E2eApiClient): Promise<number> {
  const tasks = await firstValueFrom(
    client.api.query('replication.query', []).pipe(timeout(readTimeoutMs)),
  );

  return tasks.length;
}

/** Removes the task with this name, if there is one. */
export async function ensureReplicationTaskAbsent(client: E2eApiClient, name: string): Promise<void> {
  for (const task of await findReplicationTasks(client, name)) {
    await firstValueFrom(
      client.api.call('replication.delete', [task.id]).pipe(timeout(slowCallTimeoutMs)),
    );
  }
}

/**
 * Creates a local push task from one dataset to another, if none has this name.
 *
 * For the task a run acts on, and for a bystander. Never for the task under
 * test in a create — that one goes through the wizard. Not recursive, never
 * deletes a snapshot on the target, and runs only when asked.
 */
export async function ensureReplicationTaskPresent(
  client: E2eApiClient,
  { name, source, target }: { name: string; source: string; target: string },
): Promise<void> {
  if (await findReplicationTask(client, name)) {
    return;
  }

  await firstValueFrom(
    client.api.call('replication.create', [{
      name,
      direction: 'PUSH',
      transport: 'LOCAL',
      source_datasets: [source],
      target_dataset: target,
      recursive: false,
      also_include_naming_schema: [replicationNamingSchema],
      auto: false,
      retention_policy: 'NONE',
      readonly: 'IGNORE',
      enabled: true,
    }]).pipe(timeout(slowCallTimeoutMs)),
  );
}

/**
 * The names of a dataset's own snapshots, the part after the `@`, sorted.
 *
 * Its own only: a filter on the dataset leaves out its children's.
 */
export async function findSnapshotNames(client: E2eApiClient, dataset: string): Promise<string[]> {
  const snapshots = await firstValueFrom(
    client.api.query('pool.snapshot.query', [['dataset', '=', dataset]]).pipe(timeout(readTimeoutMs)),
  );

  return snapshots.map((snapshot) => snapshot.name.slice(snapshot.name.indexOf('@') + 1)).sort();
}

/** Takes a snapshot of one dataset, under a name the test chooses. */
export async function createSnapshot(client: E2eApiClient, dataset: string, name: string): Promise<void> {
  await firstValueFrom(
    client.api.call('pool.snapshot.create', [{ dataset, name }]).pipe(timeout(slowCallTimeoutMs)),
  );
}

/** A job as `core.get_jobs` reports it. */
type JobEntry = Extract<CallResponse<E2eApiDirectory, 'core.get_jobs'>, unknown[]>[number];

/** Every `replication.run` job middleware remembers, whichever task it ran. */
async function queryReplicationRunJobs(client: E2eApiClient): Promise<JobEntry[]> {
  return firstValueFrom(
    client.api.query('core.get_jobs', [['method', '=', 'replication.run']]).pipe(timeout(readTimeoutMs)),
  );
}

/**
 * The ids of every `replication.run` job middleware remembers right now.
 *
 * Taken before an action, so {@link findReplicationRuns} can leave them out
 * afterwards. Middleware keeps finished jobs for a while, and it hands a deleted
 * task's id to the next task created — so a run from an earlier test can carry
 * the id of a task this test just made.
 */
export async function findReplicationRunJobIds(client: E2eApiClient): Promise<number[]> {
  return (await queryReplicationRunJobs(client)).map((job) => job.id);
}

/**
 * The `replication.run` jobs for one task, leaving out the jobs in `earlier`.
 *
 * "Run job" on the card and Run Once in the wizard both start `replication.run`,
 * so `core.get_jobs` is where a run that really happened shows up, and its
 * state says whether it worked. Matched on the task's id, which is the job's
 * first argument — the same reading as `findCronRuns`.
 */
export async function findReplicationRuns(
  client: E2eApiClient,
  taskId: number,
  earlier: number[],
): Promise<{ id: number; state: string }[]> {
  return (await queryReplicationRunJobs(client))
    .filter((job) => !earlier.includes(job.id))
    .filter((job) => Array.isArray(job.arguments) && job.arguments[0] === taskId)
    .map((job) => ({ id: job.id, state: String(job.state) }));
}
