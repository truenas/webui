import {
  of, OperatorFunction, switchMap, throwError,
} from 'rxjs';
import { takeWhile } from 'rxjs/operators';
import { JobState } from 'app/enums/job-state.enum';
import { Job } from 'app/interfaces/job.interface';
import { FailedJobError } from 'app/services/errors/error.classes';

/**
 * Converts observable with a job to an observable
 * that will complete when job completes or throw on job failure.
 */
export function observeJob<R, A>(): OperatorFunction<Job<R, A>, Job<R, A>> {
  return (source$) => source$.pipe(
    takeWhile((job) => !job.time_finished, true),
    switchMap((job) => {
      if (job?.state === JobState.Failed) {
        return throwError(() => new FailedJobError(job as Job));
      }

      return of(job);
    }),
  );
}
