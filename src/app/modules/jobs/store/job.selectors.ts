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

export const selectAllNonTransientJobs = createSelector(
  selectJobs,
  (jobs) => jobs.filter((job) => !job.transient),
);

/**
 * Simply selects a job.
 * By default, observable will not complete when job completes, nor will it throw on job failure.
 *
 * If you need this behaviour, add extra `observeJob()` operator after `select()`.
 */
export const selectJob = (id: number): MemoizedSelector<object, Job | undefined> => createSelector(
  selectJobs,
  (jobs) => jobs.find((job) => job.id === id),
);

export const selectIsJobPanelOpen = createSelector(
  selectJobState,
  (state) => state.isPanelOpen,
);

export const selectRunningJobs = createSelector(
  selectAllNonTransientJobs,
  (jobs) => jobs.filter((job) => job.state === JobState.Running),
);

export const selectFailedJobs = createSelector(
  selectAllNonTransientJobs,
  (jobs) => jobs.filter((job) => job.state === JobState.Failed),
);

export const selectWaitingJobs = createSelector(
  selectAllNonTransientJobs,
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

export const selectUpdateJob = createSelector(
  selectRunningJobs,
  (jobs: Job[]) => jobs.filter((job) => job.method === 'update.update' || job.method === 'failover.upgrade'),
);

export const selectUpdateJobForActiveNode = createSelector(
  selectRunningJobs,
  (jobs: Job[]) => jobs.find((job) => job.method === 'update.update'),
);

export const selectUpdateJobForPassiveNode = createSelector(
  selectRunningJobs,
  (jobs: Job[]) => jobs.find((job) => job.method === 'failover.upgrade'),
);
