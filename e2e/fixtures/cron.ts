/**
 * Cron job preconditions, cleanup and readback, over the API.
 *
 * A job has no name; the card identifies a row by command and user, so helpers key on a command kept distinct
 * from anything an appliance might carry. Kept jobs run something harmless (`echo`, short `sleep`): enabled
 * jobs really run, and a dead run leaves one behind. `runCommandOnAppliance` removes its job once run.
 */
import type { CallResponse } from '@truenas/api-client';
import { firstValueFrom, timeout } from 'rxjs';
import type { E2eApiClient, E2eApiDirectory } from '../support/api/client';
import { runJob } from '../support/jobs';
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

/** How many cron jobs the appliance holds. */
export async function countCronjobs(client: E2eApiClient): Promise<number> {
  const cronjobs = await firstValueFrom(client.api.query('cronjob.query', []).pipe(timeout(readTimeoutMs)));

  return cronjobs.length;
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
 * Creates a job running a command, as root unless `user` says otherwise, if no
 * job runs that command already. A job cannot outlive the user it runs as, so a
 * spec removes the job before the user.
 *
 * For the job a run, an edit or a delete acts on, and for a bystander. Never
 * for the job under test in a create — that one goes through the form.
 */
export async function ensureCronjobPresent(
  client: E2eApiClient,
  {
    command,
    description,
    schedule,
    user = 'root',
  }: { command: string; description: string; schedule: CronSchedule; user?: string },
): Promise<void> {
  if (await findCronjob(client, command)) {
    return;
  }

  await firstValueFrom(
    client.api.call('cronjob.create', [{
      command, description, schedule, user, enabled: true, stdout: true, stderr: false,
    }]).pipe(timeout(slowCallTimeoutMs)),
  );
}

/**
 * Runs a shell command on the appliance as root, once, and waits for it to exit.
 *
 * The API has no public call that runs a command or writes file contents, so a
 * cron job holding the command is made, run through `cronjob.run`, and removed
 * again. Its schedule is once a year, in case the removal is never reached. The
 * command goes to a shell as written, so the caller quotes what needs it.
 */
export async function runCommandOnAppliance(
  client: E2eApiClient,
  { command, description, whatItCosts }: { command: string; description: string; whatItCosts: string },
): Promise<void> {
  await ensureCronjobPresent(client, {
    command,
    description,
    schedule: {
      minute: '0', hour: '0', dom: '1', month: '1', dow: '*',
    },
  });

  try {
    const cronjob = await findCronjob(client, command);
    if (!cronjob) {
      throw new Error(`the cron job running "${command}" was not created, so ${whatItCosts}.`);
    }

    await runJob(
      client,
      () => client.api.callAndGetJobId('cronjob.run', [cronjob.id]),
      { timeoutMs: slowCallTimeoutMs, whatItCosts },
    );
  } finally {
    await ensureCronjobAbsent(client, command);
  }
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
 * Run job is a middleware job, so `core.get_jobs` shows real runs and whether the command exited cleanly.
 * Matched on the cron job's id, the job's first argument. `error` is the failure reason and `logs` what the
 * command printed; both are empty until the run ends, and `error` stays empty on success.
 */
export async function findCronRuns(
  client: E2eApiClient,
  cronjobId: number,
): Promise<{ id: number; state: string; error: string; logs: string }[]> {
  const jobs = await firstValueFrom(
    client.api.query('core.get_jobs', [['method', '=', 'cronjob.run']]).pipe(timeout(readTimeoutMs)),
  );

  return jobs
    .filter((job) => Array.isArray(job.arguments) && job.arguments[0] === cronjobId)
    .map((job) => {
      const { error, logs_excerpt: logs } = job as { error?: unknown; logs_excerpt?: unknown };
      return {
        id: job.id,
        state: String(job.state),
        error: typeof error === 'string' ? error : '',
        logs: typeof logs === 'string' ? logs : '',
      };
    });
}
