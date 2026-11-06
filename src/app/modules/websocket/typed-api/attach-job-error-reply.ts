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
 * Attaches middleware's error reply to a `FailedJobError` as `apiErrorDetails`. A failed job's request
 * is answered with an error frame (errname, trace, extra) when it finishes, but the client stops
 * listening once the job starts, so error frames are held here and matched by the job's `message_ids`.
 * Apply after `observeJob`.
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
