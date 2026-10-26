/**
 * Times every middleware request and job the suite makes, for `yarn e2e:timings`.
 *
 * A test's duration alone does not say where it went: signing in, a fixture
 * provisioning over the API, a job the test waits on, or the UI itself. The
 * reporter (`timing-reporter.ts`) records the phases of each test; this records
 * the middleware side, so the script can say which calls a phase spent its time
 * in.
 *
 * Each worker appends one JSON line per call to its own file in the directory
 * {@link timingsDirVar} names, which `playwright.config.ts` sets to
 * `test-results/e2e-timings/`. Unset, nothing is recorded: Jest runs `runJob`
 * too (`e2e-run-job.spec.ts`), and compiles to CommonJS, where the
 * `import.meta.dirname` that would locate the directory here does not parse.
 * A line names the method and when it ran, never
 * its parameters or result, so the file is safe to publish with the rest of a
 * run — including the `unpublished` project's, whose parameters carry the
 * Active Directory credentials. Calls are matched to tests afterwards by time
 * and parallel index: a call is attributed to whatever was running then, which
 * is how a `beforeAll` hook's calls are found at all, since Playwright leaves
 * that hook out of a test's reported duration.
 *
 * Two kinds are recorded:
 *
 * - `call`: a request until its reply, or until the caller stopped waiting.
 *   Starting a job counts as one, up to the job id.
 * - `job`: a job from its start until `runJob` saw it finish. Not `trackJob`
 *   on its own: `runJob` follows every job with it, to end its waits early,
 *   and the span would be the same job twice. The suite starts no job any
 *   other way.
 *
 * Opening a connection and signing it in is a `call` named
 * {@link connectMethod}, since `withClient` pays it every time.
 *
 * A job's polls are calls inside its span, so the two overlap; the script
 * reports them apart and never adds them together.
 */
import { appendFileSync, mkdirSync } from 'node:fs';
import { join } from 'node:path';
import {
  defer, finalize, type Observable, tap,
} from 'rxjs';
import type { E2eApiClient } from './api/client';

export const timingsDirName = 'e2e-timings';

/**
 * The environment variable holding where timings go, inherited by every worker.
 * Relative to the repository, not a project's `outputDir`, for the reason
 * `coverage.ts` gives.
 */
export const timingsDirVar = 'E2E_TIMINGS_DIR';

/** What `connectAndLogin` is recorded as: no single method covers it. */
export const connectMethod = '(connect and sign in)';

export interface MiddlewareTiming {
  kind: 'call' | 'job';
  method: string;
  /** Epoch milliseconds. */
  start: number;
  durationMs: number;
  /** Whether a reply (for a job, any state) arrived before the caller stopped waiting. */
  answered: boolean;
  /** Playwright's `TEST_PARALLEL_INDEX`; absent outside a worker. */
  parallelIndex?: number;
}

/** `TrueNasApi` members this patches, one of them private to the package. */
interface PatchableApi {
  dispatch(method: string, params: unknown): Observable<unknown>;
  callAndGetJobId(method: string, ...params: unknown[]): Observable<number>;
}

const parallelIndex = process.env.TEST_PARALLEL_INDEX === undefined
  ? undefined
  : Number(process.env.TEST_PARALLEL_INDEX);

/** Which method started each job this process has seen, so a job is reported by name. */
const jobMethods = new Map<number, string>();

let directoryReady = false;
let reportedWriteFailure = false;

function record(timing: MiddlewareTiming): void {
  // Read here, not at load: the config that sets it imports this module first.
  const timingsDir = process.env[timingsDirVar];
  if (!timingsDir) {
    return;
  }
  const timingsFile = join(timingsDir, `middleware-${process.pid}.jsonl`);
  try {
    if (!directoryReady) {
      mkdirSync(timingsDir, { recursive: true });
      directoryReady = true;
    }
    appendFileSync(timingsFile, `${JSON.stringify(timing)}\n`);
  } catch (error) {
    // Never at the cost of a test: timings are a diagnostic.
    if (!reportedWriteFailure) {
      reportedWriteFailure = true;
      console.warn(`Could not record middleware timings in ${timingsFile}: ${String(error)}`);
    }
  }
}

function timed<T>(kind: MiddlewareTiming['kind'], method: () => string, source$: Observable<T>): Observable<T> {
  return defer(() => {
    const start = Date.now();
    let answered = false;
    return source$.pipe(
      tap(() => {
        answered = true;
      }),
      finalize(() => record({
        kind, method: method(), start, durationMs: Date.now() - start, answered, parallelIndex,
      })),
    );
  });
}

/** The method that started `jobId`, as far as this process saw. */
export function jobMethod(jobId: number | undefined): string {
  return (jobId === undefined ? undefined : jobMethods.get(jobId)) ?? 'unknown job';
}

/** Records something timed outside the client, from `start` until now. */
export function recordSpan(kind: MiddlewareTiming['kind'], method: string, start: number, answered: boolean): void {
  record({
    kind, method, start, durationMs: Date.now() - start, answered, parallelIndex,
  });
}

/**
 * Times `client`'s requests and jobs from now on.
 *
 * Patched on the instance: `dispatch` is the one path every request takes —
 * `call`, the queries, `generateToken`, and the reads inside `trackJob` — except
 * `callAndGetJobId`, which sends its own.
 */
export function timeMiddleware(client: E2eApiClient): void {
  const api = client.api as unknown as PatchableApi;
  const dispatch = api.dispatch.bind(api);
  const callAndGetJobId = api.callAndGetJobId.bind(api);

  api.dispatch = (method, params) => timed('call', () => method, dispatch(method, params));
  api.callAndGetJobId = (method, ...params) => timed(
    'call',
    () => method,
    callAndGetJobId(method, ...params).pipe(tap((jobId) => jobMethods.set(jobId, method))),
  );
}
