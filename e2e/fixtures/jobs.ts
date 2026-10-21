/**
 * Any middleware job, by id: what `core.get_jobs` says about it, and ending one a test started.
 *
 * Whether a job can be aborted is middleware's decision (`abortable=True` on its `@job`), and
 * nothing in webui or the generated types says which. `readJob` reports it, so a spec can check
 * the job it picked before relying on it.
 */
import { JobState, isJobFinished } from '@truenas/api-client';
import { firstValueFrom, timeout } from 'rxjs';
import type { E2eApiClient } from '../support/api/client';
import { readTimeoutMs, slowCallTimeoutMs } from '../support/timeouts';

/** From `core.job_abort` returning to the job's state turning final: middleware stopping its work. */
export const jobEndTimeoutMs = 60_000;

const jobPollIntervalMs = 1_000;

export interface JobReading {
  state: string;
  method: string;
  /** What the panel and the job dialog name the job by, when it is set. */
  description: string | null;
  abortable: boolean;
}

/** One job as `core.get_jobs` reports it now, or undefined when middleware has no record of it. */
export async function readJob(client: E2eApiClient, jobId: number): Promise<JobReading | undefined> {
  const [job] = await firstValueFrom(
    client.api.query('core.get_jobs', [['id', '=', jobId]]).pipe(timeout(readTimeoutMs)),
  );
  if (!job) {
    return undefined;
  }

  const { description, abortable } = job as { description?: unknown; abortable?: unknown };

  return {
    state: String(job.state),
    method: String(job.method),
    description: typeof description === 'string' && description !== '' ? description : null,
    abortable: abortable === true,
  };
}

/**
 * The id of the newest job of `method` middleware remembers, or 0 when there is none.
 *
 * Taken before the UI starts a job, as the mark {@link findJobStateAfter} reads past.
 */
export async function findLatestJobId(client: E2eApiClient, method: string): Promise<number> {
  const jobs = await firstValueFrom(
    client.api.query('core.get_jobs', [['method', '=', method]]).pipe(timeout(readTimeoutMs)),
  );

  // `?? 0`: the generated query entity declares `id` optional, as `UserRecord` explains.
  return Math.max(0, ...jobs.map((job) => job.id ?? 0));
}

/** The state of the oldest job of `method` newer than `afterId`, or undefined when there is none yet. */
export async function findJobStateAfter(
  client: E2eApiClient,
  method: string,
  afterId: number,
): Promise<string | undefined> {
  const jobs = await firstValueFrom(
    client.api
      .query('core.get_jobs', [['method', '=', method], ['id', '>', afterId]])
      .pipe(timeout(readTimeoutMs)),
  );
  const [first] = [...jobs].sort((a, b) => (a.id ?? 0) - (b.id ?? 0));

  return first?.state;
}

/**
 * Makes sure a job a test started is no longer running, for teardown.
 *
 * Aborts it if it has not finished, then waits for its state to turn final. A job that already
 * ended, or that middleware no longer remembers, is left alone. An abort that is refused because
 * the job finished meanwhile is not an error; only a job still unfinished at the deadline is.
 */
export async function ensureJobEnded(client: E2eApiClient, jobId: number): Promise<void> {
  const isOver = async (): Promise<boolean> => {
    const job = await readJob(client, jobId);
    return job === undefined || isJobFinished({ state: job.state as JobState });
  };

  if (await isOver()) {
    return;
  }

  let abortError: unknown;
  try {
    await firstValueFrom(client.api.call('core.job_abort', [jobId]).pipe(timeout(slowCallTimeoutMs)));
  } catch (error) {
    abortError = error;
  }

  const deadline = Date.now() + jobEndTimeoutMs;
  while (!(await isOver())) {
    if (Date.now() > deadline) {
      const detail = abortError instanceof Error ? ` core.job_abort failed with: ${abortError.message}` : '';
      throw new Error(`job ${jobId} was still running ${jobEndTimeoutMs / 1000}s after it was aborted.${detail}`);
    }
    await new Promise((resolve) => {
      setTimeout(resolve, jobPollIntervalMs);
    });
  }
}
