import {
  catchError, defer, filter, finalize, MonoTypeOperatorFunction, Observable, of, ReplaySubject, switchMap, take,
  throwError, timeout,
} from 'rxjs';
import { ApiErrorDetails } from 'app/interfaces/api-error.interface';
import { Job } from 'app/interfaces/job.interface';
import { WebUiApiClient } from 'app/modules/websocket/typed-api/typed-api-client.token';
import { FailedJobError } from 'app/services/errors/error.classes';

type Message = WebUiApiClient['connection'] extends { messages(): Observable<infer T> } ? T : never;

interface ErrorReply {
  id: string;
  error: { data?: unknown };
}

/**
 * How long a failed job waits for middleware's error reply to its request. The reply is sent once
 * the job has finished, so it races the job's final state event rather than trailing it by much;
 * the limit only matters when the socket drops in between.
 */
export const jobErrorReplyGraceMs = 2_000;

const heldErrorReplies = 20;

/**
 * Attaches middleware's error reply to a `FailedJobError` as `apiErrorDetails`.
 *
 * Middleware answers a job's request when the job finishes (the client opts out of
 * `legacy_jobs`), and a failed job's answer is an error frame carrying the errname, trace and
 * extra that the job's own `error` and `exc_info` summarise. The client stops listening for that
 * answer once the job has started, so this listens instead: every error frame from the moment the
 * job is sent is held, and a failure is matched to its frame by the job's `message_ids`.
 *
 * Apply it after `observeJob`, which is what turns a failed job into `FailedJobError`.
 */
export function attachJobErrorReply<T>(
  messages$: Observable<Message>,
  graceMs = jobErrorReplyGraceMs,
): MonoTypeOperatorFunction<T> {
  return (source$) => defer(() => {
    // Only the last few matter: the reply that counts arrives as the job ends, close to the
    // failure, and this holds every error frame on the connection while the job runs.
    const errorReplies$ = new ReplaySubject<ErrorReply>(heldErrorReplies);
    const listening = messages$.pipe(
      filter((message): message is Message & ErrorReply => Boolean(message.id && 'error' in message && message.error)),
    ).subscribe(errorReplies$);

    return source$.pipe(
      catchError((error: unknown) => {
        if (!(error instanceof FailedJobError)) {
          return throwError(() => error);
        }

        const requestIds = (error.job as Partial<Job>).message_ids ?? [];
        return errorReplies$.pipe(
          filter((reply) => requestIds.includes(reply.id)),
          take(1),
          timeout({ first: graceMs, with: () => of(null) }),
          switchMap((reply) => {
            if (reply?.error.data) {
              error.apiErrorDetails = reply.error.data as ApiErrorDetails;
            }
            return throwError(() => error);
          }),
        );
      }),
      finalize(() => listening.unsubscribe()),
    );
  });
}
