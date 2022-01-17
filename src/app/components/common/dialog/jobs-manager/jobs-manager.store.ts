import { Injectable } from '@angular/core';
import { untilDestroyed, UntilDestroy } from '@ngneat/until-destroy';
import { ComponentStore } from '@ngrx/component-store';
import { EMPTY, Observable } from 'rxjs';
import {
  catchError, map, takeUntil, take,
} from 'rxjs/operators';
import { JobsManagerState } from 'app/components/common/dialog/jobs-manager/interfaces/jobs-manager-state.interface';
import { JobState } from 'app/enums/job-state.enum';
import { Job } from 'app/interfaces/job.interface';
import { EntityUtils } from 'app/modules/entity/utils';
import { DialogService, WebSocketService } from 'app/services';

const initialState: JobsManagerState = {
  isLoading: false,
  jobs: [],
};

@UntilDestroy()
@Injectable()
export class JobsManagerStore extends ComponentStore<JobsManagerState> {
  private jobs: Job[] = [];
  private jobStates: JobState[] = [JobState.Running, JobState.Failed, JobState.Waiting];

  constructor(private ws: WebSocketService, private dialog: DialogService) {
    super(initialState);

    this.initialLoadJobs().subscribe((jobs) => {
      this.jobs = jobs;
      this.patchState({
        jobs,
        isLoading: false,
      });
    },
    () => {},
    () => {
      this.getJobUpdates().subscribe((job) => {
        this.handleUpdate(job);
      });
    });
  }

  readonly numberOfRunningJobs$: Observable<number> = this.select(
    (state) => state.jobs.filter((job) => job.state === JobState.Running).length,
  );
  readonly numberOfFailedJobs$: Observable<number> = this.select(
    (state) => state.jobs.filter((job) => job.state === JobState.Failed).length,
  );
  readonly numberOfWaitingJobs$: Observable<number> = this.select(
    (state) => state.jobs.filter((job) => job.state === JobState.Waiting).length,
  );

  initialLoadJobs(): Observable<Job[]> {
    this.setState({
      ...initialState,
      isLoading: true,
    });

    return this.ws
      .call('core.get_jobs', [[['state', 'in', this.jobStates]], { order_by: ['-id'] }])
      .pipe(
        catchError((error) => {
          new EntityUtils().errorReport(error, this.dialog);

          this.patchState({
            isLoading: false,
          });

          return EMPTY;
        }),
        take(1),
        untilDestroyed(this),
      );
  }

  getJobUpdates(): Observable<Job> {
    return this.ws.subscribe('core.get_jobs').pipe(
      map((event) => event.fields),
      untilDestroyed(this),
    );
  }

  handleInternalUpdate(job: Job): void {
    const jobIndex = this.jobs.findIndex((item) => item.id === job.id);

    if (jobIndex === -1) {
      this.jobs = [job, ...this.jobs];
    } else {
      this.jobs[jobIndex] = job;
    }
  }

  handleUpdate(job: Job): void {
    this.handleInternalUpdate(job);

    this.patchState((state) => {
      return {
        ...state,
        jobs: this.jobs.filter((job) => this.jobStates.includes(job.state)),
      };
    });
  }

  remove(job: Job): void {
    this.ws
      .call('core.job_abort', [job.id])
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        this.patchState((state) => {
          return {
            ...state,
            jobs: state.jobs.filter((item) => item.id !== job.id),
          };
        });
      });
  }
}
