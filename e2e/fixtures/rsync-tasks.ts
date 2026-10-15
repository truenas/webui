/**
 * Rsync task preconditions, cleanup and readback, over the API.
 *
 * A task has no name. The card identifies a row by its local path and its
 * remote host, so these helpers key on the path — and a spec gives every task
 * a dataset of its own. Creating, updating and deleting a task are plain calls,
 * not jobs.
 *
 * Every task made by {@link ensureRsyncTaskPresent} is in Module mode against
 * `127.0.0.1`, where no rsync daemon listens. Middleware connects to nothing on
 * save in that mode, and a task that fires on its schedule before teardown fails
 * without touching data.
 *
 * The one exception is {@link ensureRsyncSshTaskPresent}, for a spec that runs a
 * task or edits one in SSH mode. It signs in through an SSH connection back to
 * the appliance itself — see `fixtures/ssh-connections.ts` — so a run really
 * copies files and the copy is a directory the spec can read back. Running a task is a `rsynctask.run` job.
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

/**
 * Where every task the suite makes points. No rsync daemon listens there, so a
 * Module-mode task reaches nothing; an SSH-mode task reaches the appliance's own sshd.
 */
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
  {
    path,
    remoteModule,
    description,
    schedule,
  }: {
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

/**
 * Creates an SSH-mode task on this path, as root, through an SSH connection, if
 * it has none already. A push unless `direction` says otherwise.
 *
 * Middleware takes the host, user and key from the connection and ignores
 * `remotehost` in this mode. It is set anyway, to the connection's own
 * `127.0.0.1`, because the card names the row after it.
 *
 * `validate_rpath` is off: it would sign in over SSH on save to check the remote
 * path, and saving this task is setup, not what a spec checks.
 *
 * rsync is given both paths as written, with no trailing slash, so a run copies
 * the source directory itself into the destination: a push writes
 * `<remotePath>/<last segment of path>/`, a pull `<path>/<last segment of remotePath>/`.
 */
export async function ensureRsyncSshTaskPresent(
  client: E2eApiClient,
  {
    path,
    connectionId,
    remotePath,
    description,
    schedule,
    direction = 'PUSH',
    extra = [],
  }: {
    path: string;
    connectionId: number;
    remotePath: string;
    description: string;
    schedule: RsyncTaskSchedule;
    direction?: 'PUSH' | 'PULL';
    /** Extra rsync arguments. `--verbose` makes a run name what it copied in its log. */
    extra?: string[];
  },
): Promise<void> {
  if (await findRsyncTask(client, path)) {
    return;
  }

  await firstValueFrom(
    client.api.call('rsynctask.create', [{
      path,
      user: 'root',
      mode: 'SSH',
      ssh_credentials: connectionId,
      remotehost: rsyncRemoteHost,
      remotepath: remotePath,
      validate_rpath: false,
      direction,
      desc: description,
      schedule,
      extra,
      enabled: true,
    }]).pipe(timeout(slowCallTimeoutMs)),
  );
}

/** A job as `core.get_jobs` reports it, with its id narrowed — a job middleware returns always has one. */
type RsyncRunJob = Extract<CallResponse<E2eApiDirectory, 'core.get_jobs'>, unknown[]>[number] & { id: number };

/** Every `rsynctask.run` job middleware remembers, whichever task it ran. */
async function queryRsyncRunJobs(client: E2eApiClient): Promise<RsyncRunJob[]> {
  const jobs = await firstValueFrom(
    client.api.query('core.get_jobs', [['method', '=', 'rsynctask.run']]).pipe(timeout(readTimeoutMs)),
  );

  return jobs as RsyncRunJob[];
}

/**
 * The ids of every `rsynctask.run` job middleware remembers right now.
 *
 * Taken before an action, so {@link findRsyncRuns} can leave them out
 * afterwards. Middleware keeps finished jobs for a while, and it hands a deleted
 * task's id to the next task created — so a run from an earlier test can carry
 * the id of a task this test just made.
 */
export async function findRsyncRunJobIds(client: E2eApiClient): Promise<number[]> {
  return (await queryRsyncRunJobs(client)).map((job) => job.id);
}

/**
 * The `rsynctask.run` jobs for one task, leaving out the jobs in `earlier`.
 *
 * "Run job" on the card starts `rsynctask.run`, so `core.get_jobs` is where a
 * run that really happened shows up, and its state says whether it worked.
 * Matched on the task's id, which is the job's first argument — the same
 * reading as `findReplicationRuns`. `logs` is the job's `logs_excerpt`, rsync's
 * own output, or empty before the job has finished.
 */
export async function findRsyncRuns(
  client: E2eApiClient,
  taskId: number,
  earlier: number[],
): Promise<{ id: number; state: string; logs: string }[]> {
  return (await queryRsyncRunJobs(client))
    .filter((job) => !earlier.includes(job.id))
    .filter((job) => Array.isArray(job.arguments) && job.arguments[0] === taskId)
    .map((job) => {
      const { logs_excerpt: logs } = job as { logs_excerpt?: unknown };
      return { id: job.id, state: String(job.state), logs: typeof logs === 'string' ? logs : '' };
    });
}

/**
 * Starts a run of a task over the API and returns without waiting for it.
 *
 * For a spec about what the screen says after a run, not about starting one —
 * "Run job" on the card is that. The caller waits on {@link findRsyncRuns},
 * because a run expected to fail is not something `runJob` can wait for.
 */
export async function startRsyncRun(client: E2eApiClient, taskId: number): Promise<void> {
  await firstValueFrom(
    client.api.callAndGetJobId('rsynctask.run', [taskId]).pipe(timeout(slowCallTimeoutMs)),
  );
}
