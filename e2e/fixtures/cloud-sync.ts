/**
 * Cloud sync task preconditions, cleanup and readback, over the API, and the loopback SFTP credential.
 *
 * Tasks sync to SFTP at `127.0.0.1`: rclone runs on the appliance, so the remote is a local directory readable
 * with `filesystem.listdir`. Root signs in with a key (see `fixtures/loopback-ssh.ts`). Tasks have no name, so
 * helpers key on the description, as the card does. CRUD are plain calls; a run is a `cloudsync.sync` job.
 */
import type { CallResponse } from '@truenas/api-client';
import { firstValueFrom, timeout } from 'rxjs';
import { runCommandOnAppliance } from './cron';
import { ensureLoopbackRootKeyAbsent, ensureLoopbackRootKeyPresent, type LoopbackRootKey } from './loopback-ssh';
import type { E2eApiClient, E2eApiDirectory } from '../support/api/client';
import { runJob } from '../support/jobs';
import { readTimeoutMs, slowCallTimeoutMs } from '../support/timeouts';

/** A cloud sync task as middleware reports it, with its id narrowed — see `GroupRecord`. */
type CloudSyncTaskEntry = Extract<CallResponse<E2eApiDirectory, 'cloudsync.query'>, unknown[]>[number];

export type CloudSyncTaskRecord = CloudSyncTaskEntry & { id: number };

/** The crontab fields middleware stores a schedule as. */
export interface CloudSyncSchedule {
  minute: string;
  hour: string;
  dom: string;
  month: string;
  dow: string;
}

/** The credential every task syncs through, as the wizard's select lists it: `<name> (SFTP)`. */
export const loopbackCredentialName = 'e2e-cloudsync-loopback';
export const loopbackProviderLabel = 'SFTP';

/** The marker goes on the public key in root's `sshpubkey`, so teardown removes this key and only this key. */
const loopbackRootKey: LoopbackRootKey = {
  keypairName: 'e2e-cloudsync-loopback-key',
  marker: 'e2e-cloudsync-loopback',
};

/** One entry of a task's bandwidth schedule: from `time` (`HH:MM`) on, `bandwidth` bytes a second. */
export interface CloudSyncBandwidthLimit {
  time: string;
  bandwidth: number;
}

/** A sync of one small file over loopback is seconds; this is room for a slow appliance. */
export const cloudSyncRunTimeoutMs = 120_000;

async function findLoopbackCredential(
  client: E2eApiClient,
): Promise<{ id: number } | undefined> {
  const [credential] = await firstValueFrom(
    client.api.query('cloudsync.credentials.query', [['name', '=', loopbackCredentialName]])
      .pipe(timeout(readTimeoutMs)),
  );

  return credential as { id: number } | undefined;
}

/**
 * Makes the SFTP credential to `127.0.0.1`, and everything it needs, present.
 *
 * Returns the credential's id. Safe to call against an appliance an interrupted
 * run left half set up.
 */
export async function ensureLoopbackSftpCredentialPresent(client: E2eApiClient): Promise<number> {
  const keypair = await ensureLoopbackRootKeyPresent(client, loopbackRootKey);

  const existing = await findLoopbackCredential(client);
  if (existing) {
    return existing.id;
  }

  const created = await firstValueFrom(
    client.api.call('cloudsync.credentials.create', [{
      name: loopbackCredentialName,
      provider: {
        type: 'SFTP',
        // No `port`: middleware defaults it to 22, and the generated type for that field accepts no number.
        host: '127.0.0.1',
        user: 'root',
        private_key: keypair.id,
      },
    }]).pipe(timeout(slowCallTimeoutMs)),
  );

  return (created as { id: number }).id;
}

/**
 * Removes the credential, root's marked key and the keypair, in that order, and
 * stops SSH if {@link ensureLoopbackSftpCredentialPresent} was what started it.
 *
 * Tasks must already be gone: middleware refuses to delete a credential a task
 * still uses.
 */
export async function ensureLoopbackSftpCredentialAbsent(client: E2eApiClient): Promise<void> {
  const credential = await findLoopbackCredential(client);
  if (credential) {
    await firstValueFrom(
      client.api.call('cloudsync.credentials.delete', [credential.id]).pipe(timeout(slowCallTimeoutMs)),
    );
  }

  await ensureLoopbackRootKeyAbsent(client, loopbackRootKey);
}

/** Every task with this description. `query`, so none is an ordinary answer. */
export async function findCloudSyncTasks(client: E2eApiClient, description: string): Promise<CloudSyncTaskRecord[]> {
  const tasks = await firstValueFrom(
    client.api.query('cloudsync.query', [['description', '=', description]]).pipe(timeout(readTimeoutMs)),
  );

  return tasks as CloudSyncTaskRecord[];
}

/** The appliance's own record of the task with this description, or undefined. */
export async function findCloudSyncTask(
  client: E2eApiClient,
  description: string,
): Promise<CloudSyncTaskRecord | undefined> {
  const [task] = await findCloudSyncTasks(client, description);
  return task;
}

/** How many cloud sync tasks the appliance holds, whoever made them. */
export async function countCloudSyncTasks(client: E2eApiClient): Promise<number> {
  const tasks = await firstValueFrom(
    client.api.query('cloudsync.query', []).pipe(timeout(readTimeoutMs)),
  );

  return tasks.length;
}

/**
 * Removes every task with this description, if any.
 *
 * Every, because middleware does not hold descriptions unique: a wizard saved
 * twice by a retried test leaves two.
 */
export async function ensureCloudSyncTasksAbsent(client: E2eApiClient, description: string): Promise<void> {
  for (const task of await findCloudSyncTasks(client, description)) {
    await firstValueFrom(
      client.api.call('cloudsync.delete', [task.id]).pipe(timeout(slowCallTimeoutMs)),
    );
  }
}

/**
 * Creates a push task from a local directory to the loopback remote, unless one has this description.
 *
 * For tasks an edit, run, restore or delete acts on, and bystanders; never the task a create tests, which goes
 * through the wizard. Unset fields keep middleware's (and the wizard's) defaults. `bwlimit` is how a run is
 * made slow enough to stop: rclone's `--bwlimit` makes a large loopback file take minutes.
 */
export async function ensureCloudSyncTaskPresent(
  client: E2eApiClient,
  {
    description,
    credentialId,
    path,
    remoteFolder,
    schedule,
    bwlimit = [],
  }: {
    description: string;
    credentialId: number;
    path: string;
    remoteFolder: string;
    schedule: CloudSyncSchedule;
    bwlimit?: CloudSyncBandwidthLimit[];
  },
): Promise<void> {
  if (await findCloudSyncTask(client, description)) {
    return;
  }

  await firstValueFrom(
    client.api.call('cloudsync.create', [{
      description,
      credentials: credentialId,
      path,
      attributes: { folder: remoteFolder },
      direction: 'PUSH',
      transfer_mode: 'COPY',
      schedule,
      bwlimit,
      enabled: true,
    }]).pipe(timeout(slowCallTimeoutMs)),
  );
}

/** The ids of every `cloudsync.sync` job middleware remembers, so a later read can tell new runs from old. */
export async function findCloudSyncRunJobIds(client: E2eApiClient): Promise<number[]> {
  const jobs = await firstValueFrom(
    client.api.query('core.get_jobs', [['method', '=', 'cloudsync.sync']]).pipe(timeout(readTimeoutMs)),
  );

  return jobs.map((job) => job.id);
}

/**
 * Every `cloudsync.sync` job for one task that is not in `earlier`.
 *
 * Run job is a middleware job, so `core.get_jobs` shows real runs and whether they worked. Matched on the
 * task id, the job's first argument, as in `findReplicationRuns`. `dryRun` reflects `{ dry_run: true }` in the
 * second argument; `logs` is rclone's `logs_excerpt`, empty until the job finishes.
 */
export async function findCloudSyncRuns(
  client: E2eApiClient,
  taskId: number,
  earlier: number[],
): Promise<{
  id: number;
  state: string;
  dryRun: boolean;
  logs: string;
}[]> {
  const jobs = await firstValueFrom(
    client.api.query('core.get_jobs', [['method', '=', 'cloudsync.sync']]).pipe(timeout(readTimeoutMs)),
  );

  return jobs
    .filter((job) => !earlier.includes(job.id))
    .filter((job) => Array.isArray(job.arguments) && job.arguments[0] === taskId)
    .map((job) => {
      const args: unknown[] = Array.isArray(job.arguments) ? job.arguments : [];
      const options = args[1] as { dry_run?: unknown } | undefined;
      const { logs_excerpt: logs } = job as { logs_excerpt?: unknown };

      return {
        id: job.id,
        state: String(job.state),
        dryRun: options?.dry_run === true,
        logs: typeof logs === 'string' ? logs : '',
      };
    });
}

/** The ids of every `cloudsync.sync_onetime` job middleware remembers, so a later read can tell new ones from old. */
export async function findCloudSyncOnetimeJobIds(client: E2eApiClient): Promise<number[]> {
  const jobs = await firstValueFrom(
    client.api.query('core.get_jobs', [['method', '=', 'cloudsync.sync_onetime']]).pipe(timeout(readTimeoutMs)),
  );

  return jobs.map((job) => job.id);
}

/**
 * Every `cloudsync.sync_onetime` job that is not in `earlier`.
 *
 * The form's Dry Run sends the unsaved task itself as the job's first argument, and
 * `{ dry_run: true }` as its second, so there is no task id to match on — `description` is the
 * first argument's, which is what ties a job to the form that sent it. `logs` is as in
 * {@link findCloudSyncRuns}.
 */
export async function findCloudSyncOnetimeRuns(
  client: E2eApiClient,
  earlier: number[],
): Promise<{
  id: number;
  state: string;
  dryRun: boolean;
  description: string;
  logs: string;
}[]> {
  const jobs = await firstValueFrom(
    client.api.query('core.get_jobs', [['method', '=', 'cloudsync.sync_onetime']]).pipe(timeout(readTimeoutMs)),
  );

  return jobs
    .filter((job) => !earlier.includes(job.id))
    .map((job) => {
      const args: unknown[] = Array.isArray(job.arguments) ? job.arguments : [];
      const task = args[0] as { description?: unknown } | undefined;
      const options = args[1] as { dry_run?: unknown } | undefined;
      const { logs_excerpt: logs } = job as { logs_excerpt?: unknown };

      return {
        id: job.id,
        state: String(job.state),
        dryRun: options?.dry_run === true,
        description: typeof task?.description === 'string' ? task.description : '',
        logs: typeof logs === 'string' ? logs : '',
      };
    });
}

/**
 * The names of the files directly inside a task's remote folder, as the remote lists them through
 * the task's credential.
 *
 * `cloudsync.list_directory` is the form's own Folder browser call, so this reads the remote the
 * way the task does — for a remote that is not a directory on the appliance, which
 * {@link findFileNames} cannot see. It is given the task's own stored `attributes`, so what it lists
 * is exactly what the task syncs to.
 */
export async function findRemoteFileNames(client: E2eApiClient, task: CloudSyncTaskRecord): Promise<string[]> {
  const { credentials, attributes } = task;
  if (!credentials || !attributes) {
    throw new Error(`task ${task.id} has no credential or no attributes, so there is no remote to list`);
  }

  const listing = await firstValueFrom(
    client.api.call('cloudsync.list_directory', [{ credentials: credentials.id, attributes }])
      .pipe(timeout(slowCallTimeoutMs)),
  );

  // Middleware declares the rows as free-form dicts; these are rclone's `lsjson` fields.
  return (listing as { Name?: unknown; IsDir?: unknown }[])
    .filter((entry) => entry.IsDir === false)
    .map((entry) => entry.Name)
    .filter((name): name is string => typeof name === 'string')
    .sort((a, b) => a.localeCompare(b));
}

/**
 * Runs a task and waits for it, over the API.
 *
 * Only to check what a task the UI made actually does — the restore spec runs
 * the task the restore dialog created. Never for the run under test.
 */
export async function runCloudSyncTask(client: E2eApiClient, taskId: number): Promise<void> {
  await runJob(
    client,
    () => client.api.callAndGetJobId('cloudsync.sync', [taskId]),
    { timeoutMs: cloudSyncRunTimeoutMs, whatItCosts: `cloud sync task ${taskId} did not complete` },
  );
}

/**
 * Starts a run of a task over the API and returns its job id, without waiting for it.
 *
 * For a spec about the run's job rather than the task: started with a bandwidth limit, the job
 * stays running for long enough to act on. Whoever calls this ends the job in teardown.
 */
export async function startCloudSyncRun(client: E2eApiClient, taskId: number): Promise<number> {
  return firstValueFrom(
    client.api.callAndGetJobId('cloudsync.sync', [taskId]).pipe(timeout(slowCallTimeoutMs)),
  );
}

/**
 * The names of the regular files directly inside a directory.
 *
 * What a sync is for, and appears nowhere on the screen.
 */
export async function findFileNames(client: E2eApiClient, directory: string): Promise<string[]> {
  const entries = await firstValueFrom(
    client.api.call('filesystem.listdir', [directory]).pipe(timeout(readTimeoutMs)),
  );

  // Unfiltered by `count` or `get`, so this is the list form of the union.
  return (Array.isArray(entries) ? entries : [])
    .filter((entry) => entry.type === 'FILE')
    .map((entry) => entry.name)
    .filter((name): name is string => typeof name === 'string')
    .sort((a, b) => a.localeCompare(b));
}

/**
 * Writes a small file on the appliance, for a sync to have something to copy.
 *
 * No public call writes file contents, so `runCommandOnAppliance` runs it through a shell: `name` must be a
 * plain file name and `directory` free of spaces. With `sizeBytes`, the file is that many zero bytes, for a
 * run that must last long enough to be stopped.
 */
export async function writeFileOnAppliance(
  client: E2eApiClient,
  directory: string,
  name: string,
  sizeBytes?: number,
): Promise<void> {
  const command = sizeBytes === undefined
    ? `echo e2e-cloudsync > ${directory}/${name}`
    : `head -c ${sizeBytes} /dev/zero > ${directory}/${name}`;

  await runCommandOnAppliance(client, {
    command,
    description: 'e2e cloud sync seed file',
    whatItCosts: `${directory}/${name} was not written`,
  });
}
