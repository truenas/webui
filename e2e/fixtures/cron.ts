/**
 * Cron job preconditions, cleanup and readback, over the API.
 *
 * A cron job has no name. The card identifies a row by its command and its
 * user, so these helpers key on the command — and a spec keeps its commands
 * distinct from anything an appliance might already carry.
 *
 * Every job made here runs a harmless command, an `echo` or a short `sleep`: an
 * enabled job really runs on its schedule, and a run that dies before its
 * teardown leaves one behind.
 */
import type { CallResponse } from '@truenas/api-client';
import { firstValueFrom, timeout } from 'rxjs';
import type { E2eApiClient, E2eApiDirectory } from '../support/api/client';
import { readTimeoutMs, slowCallTimeoutMs } from '../support/timeouts';

/** A cron job as middleware reports it, with its id narrowed — see `GroupRecord`. */
type CronjobEntry = Extract<CallResponse<E2eApiDirectory, 'cronjob.query'>, unknown[]>[number];

export type CronjobRecord = CronjobEntry & { id: number };

/** The crontab fields middleware stores a schedule as. */
export interface CronSchedule {
  minute: string;
  hour: string;
  dom: string;
  month: string;
  dow: string;
}

/**
 * The appliance's own record of the job running a command, or undefined.
 *
 * `query`, not `queryOne` — absence is an ordinary answer here.
 */
export async function findCronjob(client: E2eApiClient, command: string): Promise<CronjobRecord | undefined> {
  const [cronjob] = await firstValueFrom(
    client.api.query('cronjob.query', [['command', '=', command]]).pipe(timeout(readTimeoutMs)),
  );

  return cronjob as CronjobRecord | undefined;
}

/**
 * Removes every job running a command, if any.
 *
 * Every, because middleware does not hold commands unique: a form saved twice
 * by a retried test leaves two jobs with the same command.
 */
export async function ensureCronjobAbsent(client: E2eApiClient, command: string): Promise<void> {
  const cronjobs = await firstValueFrom(
    client.api.query('cronjob.query', [['command', '=', command]]).pipe(timeout(readTimeoutMs)),
  );

  for (const cronjob of cronjobs) {
    await firstValueFrom(
      client.api.call('cronjob.delete', [cronjob.id]).pipe(timeout(slowCallTimeoutMs)),
    );
  }
}

/**
 * Creates a job running a command as root, if no job runs that command already.
 *
 * For the job a run, an edit or a delete acts on, and for a bystander. Never
 * for the job under test in a create — that one goes through the form.
 */
export async function ensureCronjobPresent(
  client: E2eApiClient,
  { command, description, schedule }: { command: string; description: string; schedule: CronSchedule },
): Promise<void> {
  if (await findCronjob(client, command)) {
    return;
  }

  await firstValueFrom(
    client.api.call('cronjob.create', [{
      command, description, schedule, user: 'root', enabled: true, stdout: true, stderr: false,
    }]).pipe(timeout(slowCallTimeoutMs)),
  );
}

/**
 * Starts a run of a cron job and returns the `cronjob.run` job's id without
 * waiting for it — for a spec whose subject is watching the job, not the run.
 */
export async function startCronRun(client: E2eApiClient, cronjobId: number): Promise<number> {
  return firstValueFrom(
    client.api.callAndGetJobId('cronjob.run', [cronjobId]).pipe(timeout(slowCallTimeoutMs)),
  );
}

/**
 * Every `cronjob.run` job middleware remembers for one cron job, by job id.
 *
 * "Run job" on the card calls `cronjob.run`, which middleware runs as a job of
 * its own — so `core.get_jobs` is where a run that really happened shows up,
 * and its state says whether the command exited cleanly. Matched on the cron
 * job's id, which is the job's first argument.
 */
export async function findCronRuns(
  client: E2eApiClient,
  cronjobId: number,
): Promise<{ id: number; state: string }[]> {
  const jobs = await firstValueFrom(
    client.api.query('core.get_jobs', [['method', '=', 'cronjob.run']]).pipe(timeout(readTimeoutMs)),
  );

  return jobs
    .filter((job) => Array.isArray(job.arguments) && job.arguments[0] === cronjobId)
    .map((job) => ({ id: job.id, state: String(job.state) }));
}
