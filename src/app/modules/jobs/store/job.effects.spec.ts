import { TestBed } from '@angular/core/testing';
import { provideMockActions } from '@ngrx/effects/testing';
import { TranslateService } from '@ngx-translate/core';
import { MockProvider } from 'ng-mocks';
import { Observable, of, throwError } from 'rxjs';
import { TestScheduler } from 'rxjs/testing';
import { CollectionChangeType } from 'app/enums/api.enum';
import { JobState } from 'app/enums/job-state.enum';
import { Job } from 'app/interfaces/job.interface';
import {
  abortJobPressed,
  jobAborted,
  jobAdded,
  jobChanged,
  jobRemoved,
  jobsLoaded,
  jobsNotLoaded,
} from 'app/modules/jobs/store/job.actions';
import { JobEffects } from 'app/modules/jobs/store/job.effects';
import { ApiService } from 'app/modules/websocket/api.service';
import { adminUiInitialized } from 'app/store/admin-panel/admin.actions';

describe('JobEffects', () => {
  let effects: JobEffects;
  let actions$: Observable<unknown>;
  let apiService: ApiService;
  let translateService: TranslateService;
  let testScheduler: TestScheduler;

  const mockJobs = [
    {
      id: 1,
      method: 'pool.create',
      state: JobState.Running,
      time_started: { $date: 1000 },
    },
    {
      id: 2,
      method: 'dataset.create',
      state: JobState.Success,
      time_started: { $date: 2000 },
    },
  ] as unknown as Job[];

  const mockRunningJob = mockJobs[0];
  const mockSuccessJob = mockJobs[1];

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        JobEffects,
        provideMockActions(() => actions$),
        MockProvider(ApiService, {
          call: jest.fn(),
          subscribe: jest.fn(),
        }),
        {
          provide: TranslateService,
          useValue: {
            instant: jest.fn((key: string) => key),
          },
        },
      ],
    });

    effects = TestBed.inject(JobEffects);
    apiService = TestBed.inject(ApiService);
    translateService = TestBed.inject(TranslateService);

    testScheduler = new TestScheduler((actual, expected) => {
      expect(actual).toEqual(expected);
    });
  });

  describe('loadJobs$', () => {
    it('loads jobs when admin UI is initialized', () => {
      const notCompletedJobs = [mockRunningJob];
      const completedJobs = [mockSuccessJob];

      jest.spyOn(apiService, 'call')
        .mockReturnValueOnce(of(notCompletedJobs))
        .mockReturnValueOnce(of(completedJobs));

      testScheduler.run(({ hot, expectObservable }) => {
        actions$ = hot('-a', { a: adminUiInitialized() });

        const expected = '-b';
        const expectedValues = {
          b: jobsLoaded({ jobs: [...notCompletedJobs, ...completedJobs] }),
        };

        expectObservable(effects.loadJobs$).toBe(expected, expectedValues);
      });

      expect(apiService.call).toHaveBeenCalledWith('core.get_jobs', [[['state', '!=', JobState.Success]]]);
      expect(apiService.call).toHaveBeenCalledWith('core.get_jobs', [[['state', '=', JobState.Success]], { order_by: ['-id'], limit: 30 }]);
    });

    it('dispatches jobsNotLoaded on error', () => {
      const error = new Error('Network error');
      jest.spyOn(apiService, 'call')
        .mockReturnValueOnce(throwError(() => error))
        .mockReturnValueOnce(of([]));

      jest.spyOn(console, 'error').mockImplementation();

      testScheduler.run(({ hot, expectObservable }) => {
        actions$ = hot('-a', { a: adminUiInitialized() });

        const expected = '-b';
        const expectedValues = {
          b: jobsNotLoaded({ error: 'Tasks could not be loaded' }),
        };

        expectObservable(effects.loadJobs$).toBe(expected, expectedValues);
      });

      expect(translateService.instant).toHaveBeenCalledWith('Tasks could not be loaded');
    });
  });

  describe('subscribeToUpdates$', () => {
    it('dispatches jobAdded when job is added', () => {
      jest.spyOn(apiService, 'subscribe').mockReturnValue(of({
        msg: CollectionChangeType.Added,
        fields: mockRunningJob,
        id: 1,
        collection: 'core.get_jobs',
      }));

      testScheduler.run(({ hot, expectObservable }) => {
        actions$ = hot('-a', { a: jobsLoaded({ jobs: [] }) });

        const expected = '-b';
        const expectedValues = {
          b: jobAdded({ job: mockRunningJob }),
        };

        expectObservable(effects.subscribeToUpdates$).toBe(expected, expectedValues);
      });
    });

    it('dispatches jobChanged when job is changed', () => {
      jest.spyOn(apiService, 'subscribe').mockReturnValue(of({
        msg: CollectionChangeType.Changed,
        fields: mockSuccessJob,
        id: 2,
        collection: 'core.get_jobs',
      }));

      testScheduler.run(({ hot, expectObservable }) => {
        actions$ = hot('-a', { a: jobsLoaded({ jobs: [] }) });

        const expected = '-b';
        const expectedValues = {
          b: jobChanged({ job: mockSuccessJob }),
        };

        expectObservable(effects.subscribeToUpdates$).toBe(expected, expectedValues);
      });
    });

    it('filters out removed events', () => {
      jest.spyOn(apiService, 'subscribe').mockReturnValue(of({
        msg: CollectionChangeType.Removed,
        fields: mockRunningJob,
        id: 1,
        collection: 'core.get_jobs',
      }));

      testScheduler.run(({ hot, expectObservable }) => {
        actions$ = hot('-a', { a: jobsLoaded({ jobs: [] }) });

        const expected = '--'; // No emissions
        expectObservable(effects.subscribeToUpdates$).toBe(expected);
      });
    });
  });

  describe('subscribeToRemoval$', () => {
    it('dispatches jobRemoved when job is removed', () => {
      jest.spyOn(apiService, 'subscribe').mockReturnValue(of({
        msg: CollectionChangeType.Removed,
        fields: undefined,
        id: 1,
        collection: 'core.get_jobs',
      }));

      testScheduler.run(({ hot, expectObservable }) => {
        actions$ = hot('-a', { a: jobsLoaded({ jobs: [] }) });

        const expected = '-b';
        const expectedValues = {
          b: jobRemoved({ id: 1 }),
        };

        expectObservable(effects.subscribeToRemoval$).toBe(expected, expectedValues);
      });
    });

    it('filters out non-removed events', () => {
      jest.spyOn(apiService, 'subscribe').mockReturnValue(of({
        msg: CollectionChangeType.Added,
        fields: mockRunningJob,
        id: 1,
        collection: 'core.get_jobs',
      }));

      testScheduler.run(({ hot, expectObservable }) => {
        actions$ = hot('-a', { a: jobsLoaded({ jobs: [] }) });

        const expected = '--'; // No emissions
        expectObservable(effects.subscribeToRemoval$).toBe(expected);
      });
    });
  });

  describe('abortJob$', () => {
    it('calls abort API and dispatches jobAborted', () => {
      jest.spyOn(apiService, 'call').mockReturnValue(of(null));

      testScheduler.run(({ hot, expectObservable }) => {
        actions$ = hot('-a', { a: abortJobPressed({ job: mockRunningJob }) });

        const expected = '-b';
        const expectedValues = {
          b: jobAborted({ job: mockRunningJob }),
        };

        expectObservable(effects.abortJob$).toBe(expected, expectedValues);
      });

      expect(apiService.call).toHaveBeenCalledWith('core.job_abort', [1]);
    });
  });
});
