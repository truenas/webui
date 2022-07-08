import { createFeatureSelector, createSelector } from '@ngrx/store';
import { JobState } from 'app/enums/job-state.enum';
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

export const selectIsJobPanelOpen = createSelector(
  selectJobState,
  (state) => state.isPanelOpen,
);

export const selectRunningJobs = createSelector(
  selectJobs,
  (jobs) => jobs.filter((job) => job.state === JobState.Running),
);

export const selectUpdateJob = createSelector(
  selectRunningJobs,
  (jobs) => jobs.filter((job) => job.method === 'update.update' || job.method === 'failover.upgrade'),
);

export const selectFailedJobs = createSelector(
  selectJobs,
  (jobs) => jobs.filter((job) => job.state === JobState.Failed),
);

export const selectWaitingJobs = createSelector(
  selectJobs,
  (jobs) => jobs.filter((job) => job.state === JobState.Waiting),
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
