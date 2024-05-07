import { TestScheduler } from 'rxjs/testing';
import { getTestScheduler } from 'app/core/testing/utils/get-test-scheduler.utils';
import { JobState } from 'app/enums/job-state.enum';
import { Job } from 'app/interfaces/job.interface';
import { observeJob } from './observe-job.operator';

describe('observeJob', () => {
  let testScheduler: TestScheduler;

  beforeEach(() => {
    testScheduler = getTestScheduler();
  });

  it('should complete when job completes', () => {
    testScheduler.run(({ cold, expectObservable }) => {
      const job = {
        state: JobState.Success,
        time_finished: {
          $date: 1234567890,
        },
      } as Job;
      const source$ = cold('a', { a: job });
      const expected = '(a|)';

      expectObservable(observeJob()(source$)).toBe(expected, { a: job });
    });
  });

  it('should throw when job fails', () => {
    testScheduler.run(({ cold, expectObservable }) => {
      const job = {
        state: JobState.Failed,
        time_finished: {
          $date: 1234567890,
        },
      } as Job;
      const source$ = cold('a', { a: job });

      expectObservable(observeJob()(source$)).toBe('#', undefined, job);
    });
  });

  it('emits job updates until job is finished', () => {
    testScheduler.run(({ cold, expectObservable }) => {
      const jobUpdate1 = { state: JobState.Running, progress: { percent: 1 } } as Job;
      const jobUpdate2 = { state: JobState.Running, progress: { percent: 2 } } as Job;
      const source$ = cold('a-b', { a: jobUpdate1, b: jobUpdate2 });
      const expected = 'a-b';

      expectObservable(observeJob()(source$)).toBe(expected, { a: jobUpdate1, b: jobUpdate2 });
    });
  });
});
