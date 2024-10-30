import { Injectable } from '@angular/core';
import { filter, map, merge, Observable, switchMap } from 'rxjs';
import { observeJob } from 'app/helpers/operators/observe-job.operator';
import { ApiJobMethod, ApiJobParams, ApiJobResponse } from 'app/interfaces/api/api-job-directory.interface';
import { Job } from 'app/interfaces/job.interface';
import { ApiEventService } from 'app/services/websocket/api-event.service';
import { ApiMethodService } from 'app/services/websocket/api-method.service';

@Injectable({
  providedIn: 'root',
})
export class ApiJobService {
  constructor(
    private wsMethods: ApiMethodService,
    private wsEvents: ApiEventService,
  ) {}

  private subscribeToJobUpdates(jobId: number): Observable<Job> {
    return this.wsEvents.subscribe('core.get_jobs').pipe(
      filter((apiEvent) => apiEvent.id === jobId),
      map((apiEvent) => apiEvent.fields),
      this.wsEvents.getEndEventsPipe(),
    );
  }

  /**
   * Use `job` when you care about job progress or result.
   */
  startJob<M extends ApiJobMethod>(method: M, params?: ApiJobParams<M>): Observable<number> {
    return this.wsMethods.call(method, params);
  }

  /**
   * In your subscription, next will be next job update, complete will be when the job is complete.
   */
  job<M extends ApiJobMethod>(
    method: M,
    params?: ApiJobParams<M>,
  ): Observable<Job<ApiJobResponse<M>>> {
    return this.wsMethods.call(method, params).pipe(
      switchMap((jobId: number) => {
        return merge(
          this.subscribeToJobUpdates(jobId),
          // Get job status here for jobs that complete too fast.
          this.wsMethods.call('core.get_jobs', [[['id', '=', jobId]]]).pipe(map((jobs) => jobs[0])),
        )
          .pipe(observeJob());
      }),
      this.wsEvents.getEndEventsPipe(),
    ) as Observable<Job<ApiJobResponse<M>>>;
  }
}
