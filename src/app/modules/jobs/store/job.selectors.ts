import { createFeatureSelector, createSelector, MemoizedSelector } from '@ngrx/store';
import { JobState } from 'app/enums/job-state.enum';
import { Job } from 'app/interfaces/job.interface';
import { adapter, JobsState } from 'app/modules/jobs/store/job.reducer';

export const jobStateKey = 'jobs';
export const selectJobState = createFeatureSelector<JobsState>(jobStateKey);

export interface JobSlice {
  [jobStateKey]: JobsState;
}

const { selectAll } = adapter.getSelectors();

export const selectJobs = createSelector(
  selectJobState,
  selectAll,
);

export const selectJob = (id: number): MemoizedSelector<object, Job> => createSelector(
  selectJobs,
  (jobs) => jobs.find((job) => job.id === id),
);

export const selectIsJobPanelOpen = createSelector(
  selectJobState,
  (state) => state.isPanelOpen,
);

export const selectRunningJobs = createSelector(
  selectJobs,
  (jobs) => jobs.filter((job) => job.state === JobState.Running && !job.transient),
);

export const selectUpdateJob = createSelector(
  selectRunningJobs,
  (jobs) => jobs.filter((job) => job.method === 'update.update' || job.method === 'failover.upgrade'),
);

export const selectFailedJobs = createSelector(
  selectJobs,
  (jobs) => jobs.filter((job) => job.state === JobState.Failed && !job.transient),
);

export const selectWaitingJobs = createSelector(
  selectJobs,
  (jobs) => jobs.filter((job) => job.state === JobState.Waiting && !job.transient),
);

export const selectRunningJobsCount = createSelector(
  selectRunningJobs,
  (jobs) => jobs.length,
);

export const selectFailedJobsCount = createSelector(
  selectFailedJobs,
  (jobs) => jobs.length,
);

export const selectWaitingJobsCount = createSelector(
  selectWaitingJobs,
  (jobs) => jobs.length,
);

export const selectJobsPanelSlice = createSelector(
  selectRunningJobs,
  selectWaitingJobs,
  selectFailedJobs,
  (runningJobs, waitingJobs, failedJobs) => [...runningJobs, ...waitingJobs, ...failedJobs],
);
