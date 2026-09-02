/**
 * Running middleware jobs and knowing whether they worked.
 */
import { JobState, isJobFinished } from '@truenas/api-client';
import { firstValueFrom, timeout, type Observable } from 'rxjs';
import type { E2eApiClient } from './api/client';

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
   * Tie-break for when middleware answers that it has no record of the job,
   * which it can do across a middlewared restart. Without it an unknown job is
   * reported as work that did not happen, which may be false.
   *
   * Consulted in two places: when a query is *answered* and comes back empty,
   * and when the job id never arrives (the id rides a job event over the socket
   * these jobs disrupt, so losing it says nothing about whether the work ran).
   * Never after a query that simply failed: one cut off by the restart the job
   * causes says nothing about whether the job finished, and treating it as "no
   * such job" is how a side effect that is true early becomes a false success.
   *
   * Pass one only where the side effect is the whole of what the job was for.
   * `ensurePoolAbsent` passes none, because the pool row disappears while the
   * `destroy: true` wipe is still running.
   */
  confirm?: () => Promise<boolean>;
}

/**
 * Starts a middleware job and returns when it has finished, or throws saying
 * what that cost.
 *
 * Polls `core.get_jobs` rather than following job events. `api.job()` waits for
 * `collection_update` frames, and the jobs this suite runs restart services
 * over the socket those frames arrive on — `pool.export` with
 * `restart_services: true`, `service.control` by definition. That stream goes
 * quiet rather than erroring, so waiting on it stalls until the deadline on
 * work that finished seconds in. Every poll is a fresh request, so a reconnect
 * costs one interval.
 *
 * Acquiring the job id still needs one job event: `callAndGetJobId` correlates
 * on it because what a job method returns on the wire differs by version. A
 * disruption in that window loses the id, which is why a failed start reports
 * the outcome as unknown rather than as nothing having happened.
 *
 * The deadline is wall-clock. rxjs `timeout(n)` bounds the gap between
 * emissions, so a job reporting steady progress would reset it forever.
 */
export async function runJob(
  client: E2eApiClient,
  startJob: () => Observable<number>,
  { timeoutMs, whatItCosts, confirm }: RunJobOptions,
): Promise<void> {
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
      return;
    }

    throw new Error(
      `${whatItCosts} (the job could not be started, so its outcome is unknown: `
      + `${error instanceof Error ? error.message : String(error)})`,
      { cause: error },
    );
  }

  let lastError: unknown;
  let middlewareHasNoRecord = false;

  for (;;) {
    // The verdict is computed here and acted on below. Throwing from inside the
    // try would land in this function's own catch, which exists to absorb
    // transport failures, and telling the two apart afterwards means matching on
    // message text.
    let finished: { state: string; error: string | null } | undefined;

    try {
      const [job] = await firstValueFrom(
        client.api.query('core.get_jobs', [['id', '=', jobId]]).pipe(timeout(attemptTimeout())),
      );

      middlewareHasNoRecord = job === undefined;

      if (job && isJobFinished({ state: job.state as JobState })) {
        finished = { state: job.state, error: job.error };
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
      return;
    }

    if (middlewareHasNoRecord && confirm && await confirmedQuietly(confirm)) {
      return;
    }

    if (Date.now() > deadline) {
      throw deadlineError(jobId, timeoutMs, whatItCosts, middlewareHasNoRecord, lastError);
    }

    await sleep(jobPollIntervalMs);
  }
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

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}
