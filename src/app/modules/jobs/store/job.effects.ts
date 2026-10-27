import { Injectable, inject } from '@angular/core';
import { Actions, createEffect, ofType } from '@ngrx/effects';
import { TranslateService } from '@ngx-translate/core';
import {
  EMPTY, forkJoin, Observable, of,
} from 'rxjs';
import {
  catchError, map, switchMap,
} from 'rxjs/operators';
import { CollectionChangeType } from 'app/enums/api.enum';
import { JobState } from 'app/enums/job-state.enum';
import { Job } from 'app/interfaces/job.interface';
import {
  abortJobPressed, jobAdded, jobChanged, jobRemoved, jobsLoaded, jobsNotLoaded,
} from 'app/modules/jobs/store/job.actions';
import { TypedApiService } from 'app/modules/websocket/typed-api/typed-api.service';
import { adminUiInitialized } from 'app/store/admin-panel/admin.actions';
import { jobAborted } from './job.actions';

/**
 * A `core.get_jobs` event as middleware sends it. The generated model declares only `added` and
 * `changed`, but middleware also sends `removed` (with just the `id`) when it drops a finished job.
 */
type JobEvent
  = | { msg: CollectionChangeType.Added | CollectionChangeType.Changed; fields: Job }
    | { msg: CollectionChangeType.Removed; id: number };

@Injectable()
export class JobEffects {
  private actions$ = inject(Actions);
  private api = inject(TypedApiService);
  private translate = inject(TranslateService);

  loadJobs$ = createEffect(() => this.actions$.pipe(
    ofType(adminUiInitialized),
    switchMap(() => {
      const getNotCompletedJobs$ = this.api.query('core.get_jobs', [['state', '!=', JobState.Success]]);
      const getCompletedJobs$ = this.api.query('core.get_jobs', [['state', '=', JobState.Success]], { order_by: ['-id'], limit: 30 });

      return forkJoin([
        getNotCompletedJobs$,
        getCompletedJobs$,
      ]).pipe(
        map(([notCompletedJobs, recentlyCompletedJobs]) => {
          const jobs = [...notCompletedJobs, ...recentlyCompletedJobs] as unknown as Job[];
          return jobsLoaded({ jobs });
        }),
        catchError((error: unknown) => {
          console.error(error);
          // TODO: See if it would make sense to parse middleware error.
          return of(jobsNotLoaded({
            error: this.translate.instant('Tasks could not be loaded'),
          }));
        }),
      );
    }),
  ));

  subscribeToUpdates$ = createEffect(() => this.actions$.pipe(
    ofType(jobsLoaded),
    switchMap(() => {
      return this.jobEvents().pipe(
        switchMap((event) => {
          switch (event.msg) {
            case CollectionChangeType.Added:
              return of(jobAdded({ job: event.fields }));
            case CollectionChangeType.Changed:
              return of(jobChanged({ job: event.fields }));
            default:
              return EMPTY;
          }
        }),
      );
    }),
  ));

  subscribeToRemoval$ = createEffect(() => this.actions$.pipe(
    ofType(jobsLoaded),
    switchMap(() => {
      return this.jobEvents().pipe(
        switchMap((event) => (event.msg === CollectionChangeType.Removed ? of(jobRemoved({ id: event.id })) : EMPTY)),
      );
    }),
  ));

  /**
   * Both effects above read the same subscription: the client shares one stream per event name.
   * The client's job is honest about the fields that stay null until the job starts (gap 8).
   */
  private jobEvents(): Observable<JobEvent> {
    return this.api.subscribe('core.get_jobs') as unknown as Observable<JobEvent>;
  }

  abortJob$ = createEffect(() => this.actions$.pipe(
    ofType(abortJobPressed),
    switchMap(({ job }) => {
      return this.api.call('core.job_abort', [job.id]).pipe(
        map(() => jobAborted({ job })),
      );
    }),
  ));
}
