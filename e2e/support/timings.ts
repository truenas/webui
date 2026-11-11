/**
 * Times every middleware request (`call`, including the connect-and-sign-in {@link connectMethod}) and job
 * (`job`, start until `runJob` saw it finish) for `yarn e2e:timings`; matched to tests later by time and parallel
 * index, which is how `beforeAll` calls are found. One JSON line per call into {@link timingsDirVar}; unset
 * records nothing, as Jest also runs `runJob` and can't parse `import.meta.dirname`. Lines hold method names and
 * times only, never params or results, so they're safe to publish. A job's polls overlap its span; never sum them.
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
