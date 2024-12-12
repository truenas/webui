import { Injectable } from '@angular/core';
import { Actions, createEffect, ofType } from '@ngrx/effects';
import { TranslateService } from '@ngx-translate/core';
import { EMPTY, forkJoin, of } from 'rxjs';
import {
  catchError, filter, map, switchMap,
} from 'rxjs/operators';
import { CollectionChangeType } from 'app/enums/api.enum';
import { JobState } from 'app/enums/job-state.enum';
import {
  abortJobPressed, jobAdded, jobChanged, jobRemoved, jobsLoaded, jobsNotLoaded,
} from 'app/modules/jobs/store/job.actions';
import { ApiService } from 'app/services/websocket/api.service';
import { adminUiInitialized } from 'app/store/admin-panel/admin.actions';
import { jobAborted } from './job.actions';

@Injectable()
export class JobEffects {
  loadJobs$ = createEffect(() => this.actions$.pipe(
    ofType(adminUiInitialized),
    switchMap(() => {
      const getNotCompletedJobs$ = this.api.call('core.get_jobs', [[['state', '!=', JobState.Success]]]);
      const getCompletedJobs$ = this.api.call('core.get_jobs', [[['state', '=', JobState.Success]], { order_by: ['-id'], limit: 30 }]);

      return forkJoin([
        getNotCompletedJobs$,
        getCompletedJobs$,
      ]).pipe(
        map(([notCompletedJobs, recentlyCompletedJobs]) => {
          return jobsLoaded({ jobs: [...notCompletedJobs, ...recentlyCompletedJobs] });
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
      return this.api.subscribe('core.get_jobs').pipe(
        filter((event) => event.msg !== CollectionChangeType.Removed),
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
      return this.api.subscribe('core.get_jobs').pipe(
        filter((event) => event.msg === CollectionChangeType.Removed),
        map((event) => jobRemoved({ id: event.id as number })),
      );
    }),
  ));

  abortJob$ = createEffect(() => this.actions$.pipe(
    ofType(abortJobPressed),
    switchMap(({ job }) => {
      return this.api.call('core.job_abort', [job.id]).pipe(
        map(() => jobAborted({ job })),
      );
    }),
  ));

  constructor(
    private actions$: Actions,
    private api: ApiService,
    private translate: TranslateService,
  ) {}
}
