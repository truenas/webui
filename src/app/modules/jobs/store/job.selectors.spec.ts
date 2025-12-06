import { JobState } from 'app/enums/job-state.enum';
import { Job } from 'app/interfaces/job.interface';
import { adapter, jobsInitialState, JobsState } from 'app/modules/jobs/store/job.reducer';
import {
  selectAllNonTransientJobs,
  selectFailedJobs,
  selectFailedJobsCount,
  selectFinishedJobs,
  selectIsJobPanelOpen,
  selectJob,
  selectJobWithCallId,
  selectJobs,
  selectJobState,
  selectOngoingJobs,
  selectRunningJobs,
  selectRunningJobsCount,
  selectSuccessJobs,
  selectSuccessJobsCount,
  selectUpdateJobs,
  selectUpdateJobForActiveNode,
  selectUpdateJobForPassiveNode,
  selectWaitingJobs,
  selectWaitingJobsCount,
} from 'app/modules/jobs/store/job.selectors';

describe('Job Selectors', () => {
  const mockJobs = [
    {
      id: 1,
      method: 'update.run',
      state: JobState.Running,
      transient: false,
      message_ids: ['uuid-1'],
      time_started: { $date: 6000 },
    },
    {
      id: 2,
      method: 'failover.upgrade',
      state: JobState.Running,
      transient: false,
      message_ids: ['uuid-2'],
      time_started: { $date: 5000 },
    },
    {
      id: 3,
      method: 'pool.create',
      state: JobState.Success,
      transient: false,
      time_started: { $date: 4000 },
      time_finished: { $date: 1000 },
      message_ids: ['uuid-3'],
    },
    {
      id: 4,
      method: 'dataset.delete',
      state: JobState.Failed,
      transient: false,
      time_started: { $date: 3000 },
      time_finished: { $date: 2000 },
      message_ids: ['uuid-4'],
    },
    {
      id: 5,
      method: 'user.create',
      state: JobState.Waiting,
      transient: false,
      time_started: { $date: 2000 },
      message_ids: ['uuid-5'],
    },
    {
      id: 6,
      method: 'temp.job',
      state: JobState.Running,
      transient: true,
      time_started: { $date: 1000 },
      message_ids: ['uuid-6'],
    },
  ] as Job[];

  const state: JobsState = adapter.setAll(mockJobs, {
    ...jobsInitialState,
    isPanelOpen: true,
  });

  const rootState = {
    jobs: state,
  };

  describe('selectJobState', () => {
    it('selects the job state', () => {
      expect(selectJobState(rootState)).toBe(state);
    });
  });

  describe('selectJobs', () => {
    it('selects all jobs', () => {
      expect(selectJobs(rootState)).toEqual(mockJobs);
    });
  });

  describe('selectAllNonTransientJobs', () => {
    it('filters out transient jobs', () => {
      const result = selectAllNonTransientJobs(rootState);
      expect(result).toHaveLength(5);
      expect(result.every((job) => !job.transient)).toBe(true);
    });
  });

  describe('selectJob', () => {
    it('selects a job by id', () => {
      const result = selectJob(3)(rootState);
      expect(result).toEqual(mockJobs[2]);
    });

    it('returns undefined if job is not found', () => {
      const result = selectJob(999)(rootState);
      expect(result).toBeUndefined();
    });
  });

  describe('selectJobWithCallId', () => {
    it('selects a job by call id', () => {
      const result = selectJobWithCallId('uuid-2')(rootState);
      expect(result).toEqual(mockJobs[1]);
    });

    it('returns undefined if job is not found', () => {
      const result = selectJobWithCallId('non-existent-uuid')(rootState);
      expect(result).toBeUndefined();
    });
  });

  describe('selectIsJobPanelOpen', () => {
    it('selects the isPanelOpen state', () => {
      expect(selectIsJobPanelOpen(rootState)).toBe(true);
    });
  });

  describe('selectRunningJobs', () => {
    it('filters non-transient running jobs', () => {
      const result = selectRunningJobs(rootState);
      expect(result).toHaveLength(2);
      expect(result.every((job) => job.state === JobState.Running && !job.transient)).toBe(true);
    });
  });

  describe('selectSuccessJobs', () => {
    it('filters non-transient success jobs', () => {
      const result = selectSuccessJobs(rootState);
      expect(result).toHaveLength(1);
      expect(result[0].state).toBe(JobState.Success);
    });
  });

  describe('selectFailedJobs', () => {
    it('filters non-transient failed jobs', () => {
      const result = selectFailedJobs(rootState);
      expect(result).toHaveLength(1);
      expect(result[0].state).toBe(JobState.Failed);
    });
  });

  describe('selectWaitingJobs', () => {
    it('filters non-transient waiting jobs', () => {
      const result = selectWaitingJobs(rootState);
      expect(result).toHaveLength(1);
      expect(result[0].state).toBe(JobState.Waiting);
    });
  });

  describe('selectOngoingJobs', () => {
    it('combines running and waiting jobs', () => {
      const result = selectOngoingJobs(rootState);
      expect(result).toHaveLength(3);
      expect(result.some((job) => job.state === JobState.Running)).toBe(true);
      expect(result.some((job) => job.state === JobState.Waiting)).toBe(true);
    });
  });

  describe('selectFinishedJobs', () => {
    it('combines success and failed jobs, sorted by time_finished desc, limited to 5', () => {
      const result = selectFinishedJobs(rootState);
      expect(result).toHaveLength(2);
      expect(result[0].state).toBe(JobState.Failed);
      expect(result[1].state).toBe(JobState.Success);
    });
  });

  describe('selectRunningJobsCount', () => {
    it('returns count of running jobs', () => {
      expect(selectRunningJobsCount(rootState)).toBe(2);
    });
  });

  describe('selectSuccessJobsCount', () => {
    it('returns count of success jobs', () => {
      expect(selectSuccessJobsCount(rootState)).toBe(1);
    });
  });

  describe('selectFailedJobsCount', () => {
    it('returns count of failed jobs', () => {
      expect(selectFailedJobsCount(rootState)).toBe(1);
    });
  });

  describe('selectWaitingJobsCount', () => {
    it('returns count of waiting jobs', () => {
      expect(selectWaitingJobsCount(rootState)).toBe(1);
    });
  });

  describe('selectUpdateJobs', () => {
    it('filters running jobs with update.run or failover.upgrade methods', () => {
      const result = selectUpdateJobs(rootState);
      expect(result).toHaveLength(2);
      expect(result[0].method).toBe('update.run');
      expect(result[1].method).toBe('failover.upgrade');
    });

    it('returns empty array when no update jobs are running', () => {
      const stateWithoutUpdateJobs: JobsState = adapter.setAll([mockJobs[2], mockJobs[3]], jobsInitialState);
      const result = selectUpdateJobs({ jobs: stateWithoutUpdateJobs });
      expect(result).toEqual([]);
    });
  });

  describe('selectUpdateJobForActiveNode', () => {
    it('finds running job with update.run method', () => {
      const result = selectUpdateJobForActiveNode(rootState);
      expect(result?.id).toBe(1);
      expect(result?.method).toBe('update.run');
    });
  });

  describe('selectUpdateJobForPassiveNode', () => {
    it('finds running job with failover.upgrade method', () => {
      const result = selectUpdateJobForPassiveNode(rootState);
      expect(result?.id).toBe(2);
      expect(result?.method).toBe('failover.upgrade');
    });
  });
});
