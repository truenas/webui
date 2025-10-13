import { JobState as JobStateEnum } from 'app/enums/job-state.enum';
import { Job } from 'app/interfaces/job.interface';
import {
  jobAborted,
  jobAdded,
  jobChanged,
  jobPanelClosed,
  jobRemoved,
  jobsLoaded,
  jobsNotLoaded,
} from 'app/modules/jobs/store/job.actions';
import { adapter, jobReducer, jobsInitialState } from 'app/modules/jobs/store/job.reducer';
import { adminUiInitialized } from 'app/store/admin-panel/admin.actions';
import { jobIndicatorPressed } from 'app/store/topbar/topbar.actions';

describe('jobReducer', () => {
  const mockJobs = [
    {
      id: 1,
      method: 'pool.create',
      state: JobStateEnum.Running,
      time_started: { $date: 1000 },
      message_ids: ['uuid-1'],
    },
    {
      id: 2,
      method: 'dataset.create',
      state: JobStateEnum.Success,
      time_started: { $date: 2000 },
      message_ids: ['uuid-2'],
    },
  ] as unknown as Job[];

  const mockJob = mockJobs[0];
  const mockJob2 = mockJobs[1];

  describe('initial state', () => {
    it('has correct default values', () => {
      expect(jobsInitialState).toEqual({
        ids: [],
        entities: {},
        isLoading: false,
        isPanelOpen: false,
        error: null,
      });
    });
  });

  describe('jobIndicatorPressed', () => {
    it('toggles isPanelOpen from false to true', () => {
      const state = jobReducer(jobsInitialState, jobIndicatorPressed());
      expect(state.isPanelOpen).toBe(true);
    });

    it('toggles isPanelOpen from true to false', () => {
      const initialState = { ...jobsInitialState, isPanelOpen: true };
      const state = jobReducer(initialState, jobIndicatorPressed());
      expect(state.isPanelOpen).toBe(false);
    });
  });

  describe('jobPanelClosed', () => {
    it('sets isPanelOpen to false', () => {
      const initialState = { ...jobsInitialState, isPanelOpen: true };
      const state = jobReducer(initialState, jobPanelClosed());
      expect(state.isPanelOpen).toBe(false);
    });
  });

  describe('adminUiInitialized', () => {
    it('sets isLoading to true and clears error', () => {
      const initialState = { ...jobsInitialState, error: 'Previous error' };
      const state = jobReducer(initialState, adminUiInitialized());
      expect(state.isLoading).toBe(true);
      expect(state.error).toBeNull();
    });
  });

  describe('jobsLoaded', () => {
    it('sets jobs and sets isLoading to false', () => {
      const initialState = { ...jobsInitialState, isLoading: true };
      const state = jobReducer(initialState, jobsLoaded({ jobs: [mockJob, mockJob2] }));

      expect(state.isLoading).toBe(false);
      expect(state.ids).toEqual([2, 1]); // Sorted by time_started desc
      expect(state.entities[1]).toEqual(mockJob);
      expect(state.entities[2]).toEqual(mockJob2);
    });

    it('replaces existing jobs', () => {
      const existingJobs = [{
        id: 3,
        method: 'old.job',
        state: JobStateEnum.Running,
        time_started: { $date: 500 },
        message_ids: ['uuid-3'],
      }] as unknown as Job[];

      const initialState = adapter.addOne(existingJobs[0], jobsInitialState);
      const state = jobReducer(initialState, jobsLoaded({ jobs: [mockJob] }));

      expect(state.ids).toEqual([1]);
      expect(state.entities[1]).toEqual(mockJob);
      expect(state.entities[3]).toBeUndefined();
    });
  });

  describe('jobsNotLoaded', () => {
    it('sets error and keeps isLoading true', () => {
      const state = jobReducer(jobsInitialState, jobsNotLoaded({ error: 'Failed to load' }));
      expect(state.error).toBe('Failed to load');
      expect(state.isLoading).toBe(true);
    });
  });

  describe('jobAdded', () => {
    it('adds a new job to the state', () => {
      const state = jobReducer(jobsInitialState, jobAdded({ job: mockJob }));
      expect(state.ids).toContain(1);
      expect(state.entities[1]).toEqual(mockJob);
    });

    it('adds job maintaining sort order', () => {
      const initialState = adapter.addOne(mockJob2, jobsInitialState);
      const state = jobReducer(initialState, jobAdded({ job: mockJob }));

      expect(state.ids).toEqual([2, 1]); // Sorted by time_started desc
    });
  });

  describe('jobChanged', () => {
    it('updates an existing job', () => {
      const initialState = adapter.addOne(mockJob, jobsInitialState);
      const updatedJob = {
        ...mockJob,
        state: JobStateEnum.Success,
        progress: { percent: 100 },
      } as Job;

      const state = jobReducer(initialState, jobChanged({ job: updatedJob }));
      expect(state.entities[1]?.state).toBe(JobStateEnum.Success);
    });

    it('does not add job if it does not exist', () => {
      const state = jobReducer(jobsInitialState, jobChanged({ job: mockJob }));
      // NgRx updateOne only updates if entity exists
      expect(state.ids).toEqual([]);
    });
  });

  describe('jobRemoved', () => {
    it('marks job as removed', () => {
      const initialState = adapter.addOne(mockJob, jobsInitialState);
      const state = jobReducer(initialState, jobRemoved({ id: 1 }));

      expect(state.entities[1]?.removed).toBe(true);
      expect(state.ids).toContain(1); // Job still exists, just marked as removed
    });
  });

  describe('jobAborted', () => {
    it('updates job with aborted state and completion details', () => {
      const runningJob = {
        ...mockJob,
        state: JobStateEnum.Running,
        abortable: true,
        progress: { percent: 50, description: 'In progress' },
      } as Job;

      const initialState = adapter.addOne(runningJob, jobsInitialState);
      const state = jobReducer(initialState, jobAborted({ job: runningJob }));

      expect(state.entities[1]?.state).toBe(JobStateEnum.Aborted);
      expect(state.entities[1]?.abortable).toBe(false);
      expect(state.entities[1]?.progress).toEqual({});
      expect(state.entities[1]?.time_finished).toBeDefined();
      expect(state.entities[1]?.time_finished?.$date).toBeGreaterThan(0);
    });
  });

  describe('entity adapter sorting', () => {
    it('sorts jobs by time_started descending', () => {
      const sortingJobs = [
        {
          id: 1,
          method: 'job1',
          state: JobStateEnum.Running,
          time_started: { $date: 1000 },
        },
        {
          id: 2,
          method: 'job2',
          state: JobStateEnum.Running,
          time_started: { $date: 3000 },
        },
        {
          id: 3,
          method: 'job3',
          state: JobStateEnum.Running,
          time_started: { $date: 2000 },
        },
      ] as unknown as Job[];

      const state = jobReducer(jobsInitialState, jobsLoaded({ jobs: sortingJobs }));
      expect(state.ids).toEqual([2, 3, 1]); // Sorted by time_started desc
    });
  });
});
