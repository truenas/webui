import { createEntityAdapter, EntityState } from '@ngrx/entity';
import { createReducer, on } from '@ngrx/store';
import { JobState } from 'app/enums/job-state.enum';
import { Job } from 'app/interfaces/job.interface';
import {
  jobsLoaded, jobChanged, jobRemoved, jobAdded, jobPanelClosed, jobsNotLoaded, jobAborted,
} from 'app/modules/jobs/store/job.actions';
import { adminUiInitialized } from 'app/store/admin-panel/admin.actions';
import { jobIndicatorPressed } from 'app/store/topbar/topbar.actions';

export interface JobsState extends EntityState<Job> {
  isLoading: boolean;
  isPanelOpen: boolean;
  error: string | null;
}

export const adapter = createEntityAdapter<Job>({
  selectId: (job) => job.id,
  sortComparer: (a, b) => b.time_started.$date - a.time_started.$date,
});

export const jobsInitialState: JobsState = adapter.getInitialState({
  isLoading: false,
  isPanelOpen: false,
  error: null,
});

export const jobReducer = createReducer(
  jobsInitialState,

  on(jobIndicatorPressed, (state) => ({ ...state, isPanelOpen: !state.isPanelOpen })),
  on(jobPanelClosed, (state) => ({ ...state, isPanelOpen: false })),

  on(adminUiInitialized, (state) => ({ ...state, isLoading: true, error: null })),
  on(jobsLoaded, (state, { jobs }) => adapter.setAll(jobs, { ...state, isLoading: false })),
  on(jobsNotLoaded, (state, { error }) => ({ ...state, error, isLoading: true })),

  on(jobAdded, (state, { job }) => adapter.addOne(job, state)),
  on(jobChanged, (state, { job }) => adapter.updateOne({
    id: job.id,
    changes: job,
  }, state)),
  on(jobRemoved, (state, { id }) => adapter.removeOne(id, state)),
  on(jobAborted, (state, { job }) => adapter.updateOne({
    id: job.id,
    changes: {
      state: JobState.Aborted,
      abortable: false,
      progress: null,
      time_finished: {
        $date: Date.now(),
      },
    },
  }, state)),
);
