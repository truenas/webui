import { createAction, props } from '@ngrx/store';
import { Job } from 'app/interfaces/job.interface';

export const jobPanelClosed = createAction('[Jobs] Panel Closed');
export const abortJobPressed = createAction('[Jobs] Abort Pressed', props<{ job: Job }>());

export const jobsLoaded = createAction('[Jobs API] Loaded', props<{ jobs: Job[] }>());
export const jobsNotLoaded = createAction('[Jobs API] Not Loaded', props<{ error: string }>());

export const jobAdded = createAction('[Jobs API] Job Added', props<{ job: Job }>());
export const jobChanged = createAction('[Jobs API] Job Changed', props<{ job: Job }>());
export const jobAborted = createAction('[Jobs API] Job Aborted', props<{ job: Job }>());
export const jobRemoved = createAction('[Jobs API] Job Removed', props<{ id: number }>());
