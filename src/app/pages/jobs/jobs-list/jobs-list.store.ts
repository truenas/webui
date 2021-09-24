import { Injectable } from '@angular/core';
import { untilDestroyed, UntilDestroy } from '@ngneat/until-destroy';
import { ComponentStore } from '@ngrx/component-store';
import { EMPTY, Observable } from 'rxjs';
import {
  catchError, map, take, takeUntil,
} from 'rxjs/operators';
import { JobState } from 'app/enums/job-state.enum';
import { Job } from 'app/interfaces/job.interface';
import { EntityUtils } from 'app/pages/common/entity/utils';
import { DialogService, WebSocketService } from 'app/services';

export enum JobTab {
  All,
  Active,
  Failed,
}

interface JobsListState {
  currentTab: JobTab;
  isLoading: boolean;
  jobs: Job[];
}

const initialState: JobsListState = {
  currentTab: JobTab.All,
  isLoading: false,
  jobs: [],
};

@UntilDestroy()
@Injectable()
export class JobsListStore extends ComponentStore<JobsListState> {
  private jobs: Job[] = [];

  constructor(private ws: WebSocketService, private dialog: DialogService) {
    super(initialState);

    this.getAll().subscribe((jobs) => {
      this.jobs = jobs;
      this.patchState({
        jobs,
        isLoading: false,
      });
    },
    () => {},
    () => {
      // subscribe to updates on complete
      this.getUpdates().subscribe((job) => {
        this.handleUpdate(job);
      });
    });
  }

  getAll(): Observable<Job[]> {
    this.setState({
      ...initialState,
      isLoading: true,
    });

    return this.ws.call('core.get_jobs', [[], { order_by: ['-id'] }]).pipe(
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

  getUpdates(): Observable<Job> {
    return this.ws.subscribe('core.get_jobs').pipe(
      map((event) => event.fields),
      untilDestroyed(this),
    );
  }

  selectAllJobs(): void {
    this.patchState({ currentTab: JobTab.All, jobs: this.jobs });
  }

  selectRunningJobs(): void {
    this.patchState({
      currentTab: JobTab.Active,
      jobs: this.jobs.filter((job) => job.state === JobState.Running),
    });
  }

  selectFailedJobs(): void {
    this.patchState({
      currentTab: JobTab.Failed,
      jobs: this.jobs.filter((job) => job.state === JobState.Failed),
    });
  }

  remove(job: Job): void {
    this.ws
      .call('core.job_abort', [job.id])
      .pipe(take(1), takeUntil(this.destroy$))
      .subscribe(() => {
        this.jobs = this.jobs.filter((item) => item.id !== job.id);
        this.patchState({ jobs: this.jobs });
      });
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
      switch (state.currentTab) {
        case JobTab.Failed:
          return {
            ...state,
            jobs: this.jobs.filter((job) => job.state === JobState.Failed),
          };
        case JobTab.Active:
          return {
            ...state,
            jobs: this.jobs.filter((job) => job.state === JobState.Running),
          };
        case JobTab.All:
        default:
          return {
            ...state,
            jobs: this.jobs,
          };
      }
    });
  }
}
