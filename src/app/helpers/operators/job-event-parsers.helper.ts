import {
  OperatorFunction, catchError, pipe, tap, throwError,
} from 'rxjs';
import { JobState } from 'app/enums/job-state.enum';
import { Job } from 'app/interfaces/job.interface';
import { WebSocketError } from 'app/interfaces/websocket-error.interface';

/**
 * Treats both job state FAILURE and error thrown by the observable as failure.
 * Will throw the error again for further processing
 */
export function onJobFailureOrError(
  failureCallback: (job: Job | WebSocketError) => void,
): OperatorFunction<Job, Job | WebSocketError> {
  return pipe(
    tap((job) => {
      if (job.state === JobState.Error || job.state === JobState.Failed) {
        failureCallback(job);
      }
    }),
    catchError((error: Job | WebSocketError) => {
      failureCallback(error);
      return throwError(() => error);
    }),
  );
}

export function onJobSuccess(successCallback: (job: Job) => void): OperatorFunction<Job, Job> {
  return tap((job) => {
    if (job.state === JobState.Success) {
      successCallback(job);
    }
  });
}

export function onJobAbort(abortCallback: (job: Job) => void): OperatorFunction<Job, Job> {
  return tap((job) => {
    if (job.state === JobState.Aborted) {
      abortCallback(job);
    }
  });
}
