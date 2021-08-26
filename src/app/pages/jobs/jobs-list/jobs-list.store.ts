import { Injectable } from '@angular/core';
import { untilDestroyed, UntilDestroy } from '@ngneat/until-destroy';
import { ComponentStore } from '@ngrx/component-store';
import { EMPTY, Observable } from 'rxjs';
import {
  catchError, map, take, takeUntil,
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
export class JobsListStore extends ComponentStore<JobsManagerState> {
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
    this.patchState({ jobs: this.jobs });
  }

  selectRunningJobs(): void {
    this.patchState({
      jobs: this.jobs.filter((job) => job.state === JobState.Running),
    });
  }

  selectFailedJobs(): void {
    this.patchState({
      jobs: this.jobs.filter((job) => job.state === JobState.Failed),
    });
  }

  remove(job: Job): void {
    this.ws
      .call('core.job_abort', [job.id])
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        this.jobs = this.jobs.filter((item) => item.id !== job.id);
        this.patchState({ jobs: this.jobs });
      });
  }

  handleUpdate(job: Job): void {
    const jobIndex = this.jobs.findIndex((item) => item.id === job.id);
    if (jobIndex === -1) {
      this.jobs.push(job);
    } else {
      this.jobs[jobIndex] = job;
    }

    this.patchState({ jobs: this.jobs });
  }
}
