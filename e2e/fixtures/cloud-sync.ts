/**
 * Cloud sync task preconditions, cleanup and readback, over the API — and the
 * SFTP credential they all sync through.
 *
 * ## The remote is the appliance itself
 *
 * Every task syncs to an SFTP credential pointing at `127.0.0.1`, so no outside
 * service is involved and the "remote" is a directory a test can read back with
 * `filesystem.listdir`. Middleware runs rclone on the appliance, so the address
 * is the appliance's own loopback, which needs nothing forwarded to the runner.
 *
 * Signing in as root with a key is what `sshd_config` allows without touching
 * password settings: middleware writes `PermitRootLogin without-password` unless
 * root has password login enabled. So {@link ensureLoopbackSftpCredentialPresent}
 * generates a keypair, appends its public key to root's `sshpubkey` with a marker
 * comment, makes sure SSH is running, and creates the credential on that
 * keypair. {@link ensureLoopbackSftpCredentialAbsent} undoes each part. Root's
 * other keys are left as they were: only lines carrying the marker are removed.
 *
 * A task has no name. The card identifies a row by its description, so these
 * helpers key on that. Creating, updating and deleting a task are plain calls;
 * running one is a `cloudsync.sync` job.
 */
import type { CallResponse } from '@truenas/api-client';
import { firstValueFrom, timeout } from 'rxjs';
import { ensureCronjobAbsent, ensureCronjobPresent, findCronjob } from './cron';
import { ensureServiceRunning, ensureServiceStopped, queryService } from './services';
import { ensureSshKeypairAbsent, ensureSshKeypairPresent, findSshKeypair, keypairKeys } from './ssh-keypairs';
import { findUser } from './users';
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

const loopbackKeypairName = 'e2e-cloudsync-loopback-key';

/** Appended to the public key in root's `sshpubkey`, so teardown removes this key and only this key. */
const authorizedKeyMarker = 'e2e-cloudsync-loopback';

/** A sync of one small file over loopback is seconds; this is room for a slow appliance. */
export const cloudSyncRunTimeoutMs = 120_000;

/**
 * Whether this spec started SSH, and so owes stopping it. Module state rather
 * than a return value because the start and the stop happen in different hooks.
 */
let startedSsh = false;

async function findLoopbackCredential(
  client: E2eApiClient,
): Promise<{ id: number } | undefined> {
  const [credential] = await firstValueFrom(
    client.api.query('cloudsync.credentials.query', [['name', '=', loopbackCredentialName]])
      .pipe(timeout(readTimeoutMs)),
  );

  return credential as { id: number } | undefined;
}

/** Root's authorized keys with every line this spec added taken out. */
function withoutMarkedKeys(sshpubkey: string | null | undefined): string {
  return (sshpubkey ?? '')
    .split('\n')
    .filter((line) => line.trim() !== '' && !line.trim().endsWith(` ${authorizedKeyMarker}`))
    .join('\n');
}

async function setRootAuthorizedKeys(client: E2eApiClient, sshpubkey: string): Promise<void> {
  const root = await findUser(client, 'root');
  if (!root) {
    throw new Error('user.query returned no root row, so the loopback key cannot be authorized.');
  }

  await firstValueFrom(
    client.api.call('user.update', [root.id, { sshpubkey }]).pipe(timeout(slowCallTimeoutMs)),
  );
}

/**
 * Makes the SFTP credential to `127.0.0.1`, and everything it needs, present.
 *
 * Returns the credential's id. Safe to call against an appliance an interrupted
 * run left half set up: a stale marked key is replaced rather than duplicated.
 */
export async function ensureLoopbackSftpCredentialPresent(client: E2eApiClient): Promise<number> {
  await ensureSshKeypairPresent(client, loopbackKeypairName);
  const keypair = await findSshKeypair(client, loopbackKeypairName);
  const { publicKey } = keypairKeys(keypair);
  if (!keypair || !publicKey) {
    throw new Error(`keypair "${loopbackKeypairName}" was not created with a public key.`);
  }

  const root = await findUser(client, 'root');
  const kept = withoutMarkedKeys(root?.sshpubkey);
  const marked = `${publicKey.trim()} ${authorizedKeyMarker}`;
  await setRootAuthorizedKeys(client, kept ? `${kept}\n${marked}` : marked);

  if ((await queryService(client, 'ssh'))?.state !== 'RUNNING') {
    await ensureServiceRunning(client, 'ssh', 'the cloud sync specs cannot reach the appliance over SFTP');
    startedSsh = true;
  }

  const existing = await findLoopbackCredential(client);
  if (existing) {
    return existing.id;
  }

  const created = await firstValueFrom(
    client.api.call('cloudsync.credentials.create', [{
      name: loopbackCredentialName,
      provider: {
        type: 'SFTP',
        host: '127.0.0.1',
        port: 22,
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

  const root = await findUser(client, 'root');
  const kept = withoutMarkedKeys(root?.sshpubkey);
  if (kept !== (root?.sshpubkey ?? '')) {
    await setRootAuthorizedKeys(client, kept);
  }

  await ensureSshKeypairAbsent(client, loopbackKeypairName);

  if (startedSsh) {
    await ensureServiceStopped(client, 'ssh', 'SSH stays running after the cloud sync specs');
    startedSsh = false;
  }
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
 * Creates a push task from a local directory to a directory on the loopback
 * remote, if no task has this description already.
 *
 * For the task an edit, a run, a restore or a delete acts on, and for a
 * bystander. Never for the task under test in a create — that one goes through
 * the wizard. Everything not passed is left to middleware's defaults, which are
 * also the wizard's: COPY, enabled.
 */
export async function ensureCloudSyncTaskPresent(
  client: E2eApiClient,
  {
    description,
    credentialId,
    path,
    remoteFolder,
    schedule,
  }: {
    description: string; credentialId: number; path: string; remoteFolder: string; schedule: CloudSyncSchedule;
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
 * "Run job" on the card calls `cloudsync.sync`, which middleware runs as a job,
 * so `core.get_jobs` is where a run that really happened shows up and its state
 * says whether it worked. Matched on the task's id, which is the job's first
 * argument — the same reading as `findReplicationRuns`.
 */
export async function findCloudSyncRuns(
  client: E2eApiClient,
  taskId: number,
  earlier: number[],
): Promise<{ id: number; state: string }[]> {
  const jobs = await firstValueFrom(
    client.api.query('core.get_jobs', [['method', '=', 'cloudsync.sync']]).pipe(timeout(readTimeoutMs)),
  );

  return jobs
    .filter((job) => !earlier.includes(job.id))
    .filter((job) => Array.isArray(job.arguments) && job.arguments[0] === taskId)
    .map((job) => ({ id: job.id, state: String(job.state) }));
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
    .sort((a, b) => a.localeCompare(b));
}

/**
 * Writes a small file on the appliance, for a sync to have something to copy.
 *
 * The API has no public call that writes file contents — `filesystem.file_receive`
 * is private and `filesystem.put` is an HTTP upload — so a one-off cron job runs
 * the write and is removed again. `name` must be a plain file name and `directory`
 * a path without spaces: the command goes to a shell as written.
 */
export async function writeFileOnAppliance(client: E2eApiClient, directory: string, name: string): Promise<void> {
  const command = `echo e2e-cloudsync > ${directory}/${name}`;

  await ensureCronjobPresent(client, {
    command,
    description: 'e2e cloud sync seed file',
    schedule: {
      minute: '0', hour: '0', dom: '1', month: '1', dow: '*',
    },
  });

  try {
    const cronjob = await findCronjob(client, command);
    if (!cronjob) {
      throw new Error(`the cron job writing ${directory}/${name} was not created.`);
    }

    await runJob(
      client,
      () => client.api.callAndGetJobId('cronjob.run', [cronjob.id]),
      { timeoutMs: slowCallTimeoutMs, whatItCosts: `${directory}/${name} was not written` },
    );
  } finally {
    await ensureCronjobAbsent(client, command);
  }
}
