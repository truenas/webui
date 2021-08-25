import { Injectable } from '@angular/core';
import { untilDestroyed, UntilDestroy } from '@ngneat/until-destroy';
import { ComponentStore } from '@ngrx/component-store';
import { EMPTY, Observable } from 'rxjs';
import {
  catchError, map, takeUntil, tap,
} from 'rxjs/operators';
import { JobsManagerState } from 'app/components/common/dialog/jobs-manager/interfaces/jobs-manager-state.interface';
import { JobState } from 'app/enums/job-state.enum';
import { Job } from 'app/interfaces/job.interface';
import { EntityUtils } from 'app/pages/common/entity/utils';
import { DialogService, WebSocketService } from 'app/services';

const initialState: JobsManagerState = {
  isLoading: false,
  jobs: [],
};

@UntilDestroy()
@Injectable()
export class JobsManagerStore extends ComponentStore<JobsManagerState> {
  constructor(private ws: WebSocketService, private dialog: DialogService) {
    super(initialState);

    this.initialLoadJobs().subscribe();
    this.getJobUpdates().subscribe((job) => {
      this.handleUpdate(job);
    });
  }

  readonly numberOfRunningJobs$: Observable<number> = this.select(
    (state) => state.jobs.filter((job) => job.state === JobState.Running).length,
  );
  readonly numberOfFailedJobs$: Observable<number> = this.select(
    (state) => state.jobs.filter((job) => job.state === JobState.Failed).length,
  );

  initialLoadJobs(): Observable<Job[]> {
    this.setState({
      ...initialState,
      isLoading: true,
    });

    return this.ws
      .call('core.get_jobs', [[['state', 'in', [JobState.Running, JobState.Failed]]], { order_by: ['-id'] }])
      .pipe(
        tap((jobs: Job[]) => {
          this.patchState({
            jobs,
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
        untilDestroyed(this),
      );
  }

  getJobUpdates(): Observable<Job> {
    return this.ws.subscribe('core.get_jobs').pipe(
      map((event) => event.fields),
      untilDestroyed(this),
    );
  }

  handleUpdate(job: Job): void {
    // TODO: Optimize this method
    this.patchState((state) => {
      let modifiedJobs = [...state.jobs];
      const jobExist = modifiedJobs.find((item) => item.id === job.id);

      switch (job.state) {
        case JobState.Running:
          if (jobExist) {
            jobExist.progress = job.progress;
          } else {
            modifiedJobs = [job, ...state.jobs];
          }
          break;
        case JobState.Failed:
          if (jobExist) {
            jobExist.state = job.state;
          } else {
            modifiedJobs = [job, ...state.jobs];
          }
          break;
        default:
          if (jobExist) {
            modifiedJobs = modifiedJobs.filter((item) => item.id !== job.id);
          }
          break;
      }

      return {
        ...state,
        jobs: modifiedJobs,
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
