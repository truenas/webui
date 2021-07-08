import { Injectable } from '@angular/core';
import { ComponentStore } from '@ngrx/component-store';
import { EMPTY, Observable } from 'rxjs';
import {
  catchError, takeUntil, tap,
} from 'rxjs/operators';
import { JobsManagerState } from 'app/components/common/dialog/jobs-manager/interfaces/jobs-manager-state.interface';
import { JobState } from 'app/enums/job-state.enum';
import { Job } from 'app/interfaces/job.interface';
import { EntityUtils } from 'app/pages/common/entity/utils';
import { DialogService, WebSocketService } from 'app/services';

const initialState: JobsManagerState = {
  isLoading: false,
  jobs: null,
  runningJobs: null,
  failedJobs: null,
};

@Injectable()
export class JobsManagerStore extends ComponentStore<JobsManagerState> {
  readonly limit = 5;

  constructor(private ws: WebSocketService, private dialog: DialogService) {
    super(initialState);

    this.subscribeToUpdates();
  }

  readonly jobs$: Observable<Job[]> = this.select((state: JobsManagerState) => state.jobs);
  readonly runningJobs$: Observable<number> = this.select((state: JobsManagerState) => state.runningJobs);

  readonly loadJobs = this.effect(() => {
    this.setState({
      ...initialState,
      isLoading: true,
    });

    return this.ws
      .call('core.get_jobs', [
        [['state', 'in', [JobState.Running, JobState.Failed]]],
        { order_by: ['-id'], limit: this.limit },
      ])
      .pipe(
        tap((jobs: Job[]) => {
          this.patchState({
            jobs,
            failedJobs: jobs.filter((job) => job.state === JobState.Failed).length,
            runningJobs: jobs.filter((job) => job.state === JobState.Running).length,
            isLoading: false,
          });
        }),
        catchError((error) => {
          new EntityUtils().errorReport(error, this.dialog);

          this.patchState({
            isLoading: false,
          });

          return EMPTY;
        }),
        takeUntil(this.destroy$),
      );
  });

  readonly subscribeToUpdates = this.effect(() => {
    return this.ws
      .subscribe('core.get_jobs')
      .pipe(
        tap((event) => {
          this.addOrUpdate(event.fields);
        }),
        takeUntil(this.destroy$),
      );
  });

  addOrUpdate(job: Job): void {
    this.patchState((state) => {
      let newJobs = [...state.jobs];
      const jobExist = newJobs.find((item) => item.id === job.id);

      if (jobExist && job.state === JobState.Failed) {
        jobExist.state = job.state;
      } else if (jobExist && job.state === JobState.Success) {
        newJobs = newJobs.filter((item) => item.id !== job.id);
      } else {
        if (newJobs.length === this.limit) {
          newJobs.pop();
        }
        newJobs = [job, ...state.jobs];
      }

      return {
        ...state,
        jobs: newJobs,
        runningJobs: newJobs.filter((job) => job.state === JobState.Running).length,
      };
    });
  }

  remove(job: Job): void {
    this.patchState((state) => {
      return {
        ...state,
        jobs: state.jobs.filter((item) => item.id !== job.id),
        runningJobs: state.runningJobs - 1,
      };
    });
  }
}
