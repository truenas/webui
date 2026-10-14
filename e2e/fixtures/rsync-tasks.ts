/**
 * Rsync task preconditions, cleanup and readback, over the API.
 *
 * A task has no name. The card identifies a row by its local path and its
 * remote host, so these helpers key on the path — and a spec gives every task
 * a dataset of its own. Creating, updating and deleting a task are plain calls,
 * not jobs.
 *
 * Every task made here is in Module mode against `127.0.0.1`, where no rsync
 * daemon listens. Middleware connects to nothing on save in that mode, and a
 * task that fires on its schedule before teardown fails without touching data.
 */
import type { CallResponse } from '@truenas/api-client';
import { firstValueFrom, timeout } from 'rxjs';
import type { E2eApiClient, E2eApiDirectory } from '../support/api/client';
import { readTimeoutMs, slowCallTimeoutMs } from '../support/timeouts';

/** A rsync task as middleware reports it, with its id narrowed — see `GroupRecord`. */
type RsyncTaskEntry = Extract<CallResponse<E2eApiDirectory, 'rsynctask.query'>, unknown[]>[number];

export type RsyncTaskRecord = RsyncTaskEntry & { id: number };

/** The crontab fields middleware stores a schedule as. */
export interface RsyncTaskSchedule {
  minute: string;
  hour: string;
  dom: string;
  month: string;
  dow: string;
}

/** Where every task the suite makes points: nothing listens there. */
export const rsyncRemoteHost = '127.0.0.1';

/** Every task syncing this local path. `query`, so none is an ordinary answer. */
export async function findRsyncTasks(client: E2eApiClient, path: string): Promise<RsyncTaskRecord[]> {
  const tasks = await firstValueFrom(
    client.api.query('rsynctask.query', [['path', '=', path]]).pipe(timeout(readTimeoutMs)),
  );

  return tasks as RsyncTaskRecord[];
}

/** The appliance's own record of the task on this path, or undefined. */
export async function findRsyncTask(client: E2eApiClient, path: string): Promise<RsyncTaskRecord | undefined> {
  const [task] = await findRsyncTasks(client, path);
  return task;
}

/** How many rsync tasks the appliance holds, whoever made them. */
export async function countRsyncTasks(client: E2eApiClient): Promise<number> {
  const tasks = await firstValueFrom(
    client.api.query('rsynctask.query', []).pipe(timeout(readTimeoutMs)),
  );

  return tasks.length;
}

/**
 * Removes every task on this path, if any.
 *
 * Every, because middleware does not hold one task per path: a form saved twice
 * by a retried test leaves two.
 */
export async function ensureRsyncTasksAbsent(client: E2eApiClient, path: string): Promise<void> {
  for (const task of await findRsyncTasks(client, path)) {
    await firstValueFrom(
      client.api.call('rsynctask.delete', [task.id]).pipe(timeout(slowCallTimeoutMs)),
    );
  }
}

/**
 * Creates a Module-mode push task on this path, as root, if it has none already.
 *
 * For the task an edit or a delete acts on, and for a bystander. Never for the
 * task under test in a create — that one goes through the form. Everything not
 * passed is left to middleware's defaults, which are also the form's.
 */
export async function ensureRsyncTaskPresent(
  client: E2eApiClient,
  { path, remoteModule, description, schedule }: {
    path: string; remoteModule: string; description: string; schedule: RsyncTaskSchedule;
  },
): Promise<void> {
  if (await findRsyncTask(client, path)) {
    return;
  }

  await firstValueFrom(
    client.api.call('rsynctask.create', [{
      path,
      user: 'root',
      mode: 'MODULE',
      remotehost: rsyncRemoteHost,
      remotemodule: remoteModule,
      direction: 'PUSH',
      desc: description,
      schedule,
      enabled: true,
    }]).pipe(timeout(slowCallTimeoutMs)),
  );
}
