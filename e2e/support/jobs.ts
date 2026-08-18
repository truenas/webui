/**
 * Running middleware jobs and knowing whether they worked.
 *
 * Lives here rather than beside its first caller because it is general: any
 * fixture that starts a job needs it, and `e2e/CLAUDE.md` tells contributors to
 * route jobs through it. A helper the documentation names has to be importable.
 */
import { JobState, isJobFinished } from '@truenas/api-client';
import { firstValueFrom, timeout, type Observable } from 'rxjs';
import type { E2eApiClient } from './api/client';
import { readTimeoutMs } from './timeouts';

const jobPollIntervalMs = 2_000;

/**
 * A finished job that did not finish successfully.
 *
 * An allow-list, and that is the point: `runJob` reports the work done for any
 * terminal state outside it, so a deny-list would have to be exhaustive to keep
 * the verdict honest, and could quietly stop being so.
 *
 * `SUCCESS` is the whole pass set. Middleware's `Job.state` is exactly
 * `WAITING | RUNNING | SUCCESS | FAILED | ABORTED` — see this repo's own
 * `src/app/enums/job-state.enum.ts`, which cites `job.py` and notes that the
 * other states a reader might expect (`FINISHED`, `ERROR`, `HOLD`, `PENDING`,
 * `LOCKED`) belong to `TaskState`. The client's `isJobFinished` covers those
 * too, so it is broader than the job model; this is the narrower, correct test.
 */
function jobFailed(state: string): boolean {
  return state !== String(JobState.Success);
}

interface RunJobOptions {
  /** Wall-clock budget for the whole job. */
  timeoutMs: number;
  /** What it costs the next run if this did not happen. Thrown verbatim. */
  whatItCosts: string;
  /**
   * Consulted only when the job row cannot be found at all.
   *
   * Middleware can lose a job record — dropped across a middlewared restart, or
   * trimmed from the list — and in that case the work may well have succeeded.
   * Without this, an unknown job is reported as work that did not happen, which
   * is a false statement in exactly the case it is describing. The job's own
   * state stays the primary verdict; this only breaks the tie when there is no
   * state to read.
   */
  confirm?: () => Promise<boolean>;
}

/**
 * Starts a middleware job and returns when it has finished, or throws saying
 * what that cost.
 *
 * **Polls the job row rather than following job events.** `api.job()` is the
 * natural call and the wrong one here: it waits for `collection_update` frames,
 * and the jobs this suite runs restart services over the socket those frames
 * arrive on — `pool.export` with `restart_services: true`, `service.control` by
 * definition. When that happens the stream does not error, it goes quiet, and
 * waiting on it stalls until the deadline on work that finished seconds in.
 * Re-reading `core.get_jobs` costs one poll interval instead, because every
 * attempt is a fresh request over whatever connection currently exists.
 *
 * One socket dependency remains and is worth naming rather than glossing:
 * `callAndGetJobId` derives the id from the first job event, not from the RPC
 * response, because what a job method returns on the wire differs by version.
 * So a disruption between sending the call and middleware creating the job
 * loses the id. That window is small — the job is created on receipt, before it
 * does any of the disruptive work — but it is not zero, which is why a failed
 * start reports the outcome as *unknown* rather than as nothing having happened.
 *
 * The deadline is wall-clock. rxjs `timeout(n)` would not be: it bounds the gap
 * between emissions, so a job reporting steady progress resets it forever.
 */
export async function runJob(
  client: E2eApiClient,
  startJob: () => Observable<number>,
  { timeoutMs, whatItCosts, confirm }: RunJobOptions,
): Promise<void> {
  let jobId: number;
  try {
    jobId = await firstValueFrom(startJob().pipe(timeout(readTimeoutMs)));
  } catch (error) {
    throw new Error(
      `${whatItCosts} (the job could not be started, so its outcome is unknown: `
      + `${error instanceof Error ? error.message : String(error)})`,
      { cause: error },
    );
  }

  const deadline = Date.now() + timeoutMs;
  let lastError: unknown;
  let everSawTheJob = false;

  for (;;) {
    // The verdict is computed inside the try and acted on outside it. Throwing
    // from within would land in this function's own `catch`, which exists to
    // absorb transport failures — and telling the two apart afterwards means
    // matching on message text, which is not control flow worth having.
    let finished: { state: string; error: string | null } | undefined;

    try {
      const [job] = await firstValueFrom(
        client.api.query('core.get_jobs', [['id', '=', jobId]]).pipe(timeout(readTimeoutMs)),
      );

      if (job) {
        everSawTheJob = true;
        if (isJobFinished({ state: job.state as JobState })) {
          finished = { state: job.state, error: job.error };
        }
      }

      lastError = undefined;
    } catch (error) {
      // Transient: the restart this job performs drops the connection used to
      // ask about it. Keep asking until the deadline.
      lastError = error;
    }

    if (finished) {
      if (jobFailed(finished.state)) {
        const reason = finished.error ? `: ${finished.error}` : '';
        throw new Error(`${whatItCosts} (job ${jobId} ended ${finished.state}${reason})`);
      }
      return;
    }

    // Only once the job row itself has gone missing — never as a general
    // completion signal, which is what made two earlier revisions of this
    // helper report a failed export as a clean teardown.
    if (!everSawTheJob && confirm && await confirmedQuietly(confirm)) {
      return;
    }

    if (Date.now() > deadline) {
      throw deadlineError(jobId, timeoutMs, whatItCosts, everSawTheJob, lastError);
    }

    await sleep(jobPollIntervalMs);
  }
}

/** A confirmation that cannot itself fail the run — it is a tie-break, not a test. */
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
  everSawTheJob: boolean,
  lastError: unknown,
): Error {
  const detail = lastError instanceof Error
    ? ` Last attempt failed with: ${lastError.message}`
    : '';

  // "Never seen" and "seen but unfinished" are different diagnoses: the first
  // means middleware does not know this job, and pointing at a slow job would
  // send someone looking in the wrong place.
  const whatHappened = everSawTheJob
    ? `job ${jobId} had not finished ${timeoutMs / 1000}s after it started`
    : `job ${jobId} never appeared in core.get_jobs within ${timeoutMs / 1000}s`;

  return new Error(`${whatItCosts} (${whatHappened}.${detail})`, { cause: lastError });
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}
