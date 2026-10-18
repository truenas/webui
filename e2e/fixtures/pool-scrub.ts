/**
 * A pool's scheduled scrub task: preconditions and readback, over the API.
 *
 * Middleware may make a task for a pool when the pool is created, so a spec puts
 * the task in the state it needs rather than assuming one. Tasks are keyed by the
 * pool's id, which these helpers look up by name. The UI has no delete for a
 * task, so {@link ensureScrubTasksAbsent} is for setup only.
 */
import type { CallResponse } from '@truenas/api-client';
import { firstValueFrom, timeout } from 'rxjs';
import type { CronSchedule } from './cron';
import { findPool } from './storage';
import type { E2eApiClient, E2eApiDirectory } from '../support/api/client';
import { readTimeoutMs, slowCallTimeoutMs } from '../support/timeouts';

/** A scrub task as middleware reports it, with its id narrowed — see `CronjobRecord`. */
type ScrubTaskEntry = Extract<CallResponse<E2eApiDirectory, 'pool.scrub.query'>, unknown[]>[number];

export type ScrubTaskRecord = ScrubTaskEntry & { id: number };

async function getPoolId(client: E2eApiClient, name: string): Promise<number> {
  const pool = await findPool(client, name);
  if (!pool) {
    throw new Error(`The appliance reports no pool named "${name}", so it has no scrub task to set up.`);
  }

  return pool.id;
}

/** Every scrub task middleware holds for the pool. `query`, not `queryOne`: none is an ordinary answer. */
export async function findScrubTasks(client: E2eApiClient, name: string): Promise<ScrubTaskRecord[]> {
  const poolId = await getPoolId(client, name);
  const tasks = await firstValueFrom(
    client.api.query('pool.scrub.query', [['pool', '=', poolId]]).pipe(timeout(readTimeoutMs)),
  );

  return tasks as ScrubTaskRecord[];
}

/** Deletes every scrub task the pool has, so its card reads "Not Set". */
export async function ensureScrubTasksAbsent(client: E2eApiClient, name: string): Promise<void> {
  for (const task of await findScrubTasks(client, name)) {
    await firstValueFrom(
      client.api.call('pool.scrub.delete', [task.id]).pipe(timeout(slowCallTimeoutMs)),
    );
  }
}

/**
 * Leaves the pool with one enabled scrub task on `schedule` and `threshold`:
 * the task middleware made, updated, or a new one if there is none.
 *
 * For the task an edit acts on. Never for the task under test in a create —
 * that one goes through the form.
 */
export async function ensureScrubTaskEnabled(
  client: E2eApiClient,
  name: string,
  { schedule, threshold }: { schedule: CronSchedule; threshold: number },
): Promise<void> {
  const poolId = await getPoolId(client, name);
  const [existing] = await findScrubTasks(client, name);

  if (existing) {
    await firstValueFrom(
      client.api.call('pool.scrub.update', [existing.id, { schedule, threshold, enabled: true }])
        .pipe(timeout(slowCallTimeoutMs)),
    );
    return;
  }

  await firstValueFrom(
    client.api.call('pool.scrub.create', [{
      pool: poolId,
      schedule,
      threshold,
      enabled: true,
      description: '',
    }]).pipe(timeout(slowCallTimeoutMs)),
  );
}
