/**
 * Running middleware jobs and knowing whether they worked.
 */
import { JobState, isJobFinished } from '@truenas/api-client';
import {
  firstValueFrom, tap, timeout, type Observable,
} from 'rxjs';
import type { E2eApiClient } from './api/client';
import { jobMethod, recordSpan } from './timings';

/**
 * The longest a finished job can go unnoticed when its events are lost. Most
 * jobs end well inside it, and their events end the wait as soon as they do;
 * see `watchForFinish`.
 */
const jobPollIntervalMs = 2_000;

/**
 * Share of the *remaining* budget any single read may take.
 *
 * Derived rather than fixed so this stays a retry loop at short budgets — a
 * fixed 30s bound against a 60s job leaves room for one attempt — and taken from
 * what is left rather than the original, so an attempt cannot run past the
 * deadline it is being measured against.
 */
const attemptShareOfBudget = 3;

/** Floor, so the last attempts before a deadline are not bounded to nothing. */
const minAttemptTimeoutMs = 5_000;

interface RunJobOptions {
  /** Wall-clock budget for the whole job. */
  timeoutMs: number;
  /** What it costs the next run if this did not happen. Thrown verbatim. */
  whatItCosts: string;
  /**
   * Tie-break for when middleware has no record of the job, which can happen across a middlewared restart.
   * Consulted when a query answers empty or the job id never arrives, never after a query that failed: a cut-off
   * query says nothing about whether the job finished. Pass one only where the side effect is the whole job;
   * `ensurePoolAbsent` passes none, because the pool row vanishes while the `destroy: true` wipe still runs.
   */
  confirm?: () => Promise<boolean>;
  /**
   * Ask `core.get_jobs` for the result unredacted. Middleware masks every
   * `Secret` in a job's result for an external caller unless it asks, and
   * refuses the asking without full administrative privileges. Only a caller
   * that needs a secret out of the result sets this.
   */
  rawResult?: boolean;
}

/**
 * Starts a middleware job and returns its result once finished (`undefined` when `confirm` settled it), or
 * throws saying what that cost. Polls `core.get_jobs` because these jobs restart services over the socket job
 * events arrive on, so a final event can go to nobody; events only end each wait early (otherwise most jobs
 * paid a whole interval). The id still needs one event, so a disruption then reports the outcome as unknown.
 * The deadline is wall-clock: rxjs `timeout(n)` bounds gaps between emissions, so progress would reset it.
 */
export async function runJob(
  client: E2eApiClient,
  startJob: () => Observable<number>,
  options: RunJobOptions,
): Promise<unknown> {
  // The whole wait, for `timings.ts`: polls alone leave out the sleeps between them.
  const start = Date.now();
  let jobId: number | undefined;
  let finished = false;
  try {
    const result = await followJob(client, () => startJob().pipe(tap((id) => {
      jobId = id;
    })), options);
    finished = true;
    return result;
  } finally {
    recordSpan('job', jobMethod(jobId), start, finished);
  }
}

async function followJob(
  client: E2eApiClient,
  startJob: () => Observable<number>,
  {
    timeoutMs, whatItCosts, confirm, rawResult = false,
  }: RunJobOptions,
): Promise<unknown> {
  // Started before the deadline so the whole call, not just the polling, is
  // covered by `timeoutMs`.
  const deadline = Date.now() + timeoutMs;
  const attemptTimeout = (): number => Math.max(
    minAttemptTimeoutMs,
    Math.floor(Math.max(0, deadline - Date.now()) / attemptShareOfBudget),
  );

  let jobId: number;
  try {
    jobId = await firstValueFrom(startJob().pipe(timeout(attemptTimeout())));
  } catch (error) {
    // Losing the id is the expected shape of this failure, not an exotic one:
    // the id arrives on a job event, over the socket these jobs disrupt. The
    // call itself may well have been accepted and the work done, so ask
    // `confirm` before reporting an unknown outcome — this is the one path
    // where it can be decisive rather than a tie-break.
    if (confirm && await confirmedQuietly(confirm)) {
      return undefined;
    }

    throw new Error(
      `${whatItCosts} (the job could not be started, so its outcome is unknown: `
      + `${error instanceof Error ? error.message : String(error)})`,
      { cause: error },
    );
  }

  let lastError: unknown;
  let middlewareHasNoRecord = false;

  // Stopped however the loop ends: a job whose finish no event reported would
  // leave it watching.
  const finish = watchForFinish(client, jobId);
  try {
    for (;;) {
      // The verdict is computed here and acted on below. Throwing from inside the
      // try would land in this function's own catch, which exists to absorb
      // transport failures, and telling the two apart afterwards means matching on
      // message text.
      let finished: { state: string; error: string | null; result: unknown } | undefined;

      try {
        const [job] = await firstValueFrom(
          client.api
            .query('core.get_jobs', [['id', '=', jobId]], rawResult ? { extra: { raw_result: true } } : {})
            .pipe(timeout(attemptTimeout())),
        );

        middlewareHasNoRecord = job === undefined;

        if (job && isJobFinished({ state: job.state as JobState })) {
          finished = { state: job.state, error: job.error, result: job.result };
        }

        lastError = undefined;
      } catch (error) {
        // Transient: the restart this job performs drops the connection used to
        // ask about it. An unanswered query says nothing about the job, so it
        // must not leave the tie-break enabled from a previous answer.
        middlewareHasNoRecord = false;
        lastError = error;
      }

      if (finished) {
        if (jobFailed(finished.state)) {
          const reason = finished.error ? `: ${finished.error}` : '';
          throw new Error(`${whatItCosts} (job ${jobId} ended ${finished.state}${reason})`);
        }
        return finished.result;
      }

      if (middlewareHasNoRecord && confirm && await confirmedQuietly(confirm)) {
        return undefined;
      }

      if (Date.now() > deadline) {
        throw deadlineError(jobId, timeoutMs, whatItCosts, middlewareHasNoRecord, lastError);
      }

      await finish.wait(jobPollIntervalMs);
    }
  } finally {
    finish.stop();
  }
}

interface FinishWatch {
  /** Waits `ms`, or less if the job's events say it has finished. */
  wait(ms: number): Promise<void>;
  stop(): void;
}

/**
 * Watches `jobId`'s events for it finishing, only to end the wait between polls early; the poll still reads the
 * verdict, so a lost event or errored stream just leaves the polls to find it. `trackJob` filters the client's
 * one `core.get_jobs` subscription (renewed per reconnect), so this costs one read per job. A finish wakes one
 * wait only, so a poll that doesn't yet see it falls back to a full interval, not a tight loop.
 */
function watchForFinish(client: E2eApiClient, jobId: number): FinishWatch {
  let finished = false;
  let wake: (() => void) | undefined;

  const watching = client.api.trackJob(jobId).subscribe({
    next: (job) => {
      if (isJobFinished(job)) {
        finished = true;
        wake?.();
      }
    },
    error: () => undefined,
  });

  return {
    wait: (ms) => new Promise((resolve) => {
      if (finished) {
        finished = false;
        resolve();
        return;
      }
      const timer = setTimeout(done, ms);
      function done(): void {
        clearTimeout(timer);
        wake = undefined;
        finished = false;
        resolve();
      }
      wake = done;
    }),
    stop: () => watching.unsubscribe(),
  };
}

/**
 * Whether a finished job failed.
 *
 * `SUCCESS` is the whole pass set: middleware's `Job.state` is only
 * `WAITING | RUNNING | SUCCESS | FAILED | ABORTED` (see
 * `src/app/enums/job-state.enum.ts`, which cites `job.py`; `FINISHED` and
 * `ERROR` belong to `TaskState`). Testing for success rather than listing
 * failures means the check cannot become incomplete.
 */
function jobFailed(state: string): boolean {
  return state !== String(JobState.Success);
}

/** A tie-break, not a test: it must not be able to fail the run itself. */
async function confirmedQuietly(confirm: () => Promise<boolean>): Promise<boolean> {
  try {
    return await confirm();
  } catch {
    return false;
  }
}

function deadlineError(
  jobId: number,
  timeoutMs: number,
  whatItCosts: string,
  middlewareHasNoRecord: boolean,
  lastError: unknown,
): Error {
  const detail = lastError instanceof Error
    ? ` Last attempt failed with: ${lastError.message}`
    : '';

  // Distinct diagnoses: middleware not knowing the job points somewhere other
  // than a slow job.
  const whatHappened = middlewareHasNoRecord
    ? `middleware had no record of job ${jobId} after ${timeoutMs / 1000}s`
    : `job ${jobId} had not finished ${timeoutMs / 1000}s after it started`;

  return new Error(`${whatItCosts} (${whatHappened}.${detail})`, { cause: lastError });
}

