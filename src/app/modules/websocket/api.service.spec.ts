import { TestBed } from '@angular/core/testing';
import { createServiceFactory, mockProvider, SpectatorService } from '@ngneat/spectator/jest';
import { MockStore, provideMockStore } from '@ngrx/store/testing';
import {
  BehaviorSubject,
  firstValueFrom, of, Subscription,
} from 'rxjs';
import { ApiErrorName } from 'app/enums/api.enum';
import { JobState } from 'app/enums/job-state.enum';
import {
  IncomingMessage,
  JsonRpcError,
} from 'app/interfaces/api-message.interface';
import { Job } from 'app/interfaces/job.interface';
import { Pool } from 'app/interfaces/pool.interface';
import {
  JobSlice, selectJobs,
} from 'app/modules/jobs/store/job.selectors';
import { ApiService } from 'app/modules/websocket/api.service';
import { SubscriptionManagerService } from 'app/modules/websocket/subscription-manager.service';
import { WebSocketHandlerService } from 'app/modules/websocket/websocket-handler.service';
import { ApiCallError, FailedJobError } from 'app/services/errors/error.classes';
import { WebSocketStatusService } from 'app/services/websocket-status.service';

describe('ApiService', () => {
  let spectator: SpectatorService<ApiService>;
  let wsHandler: WebSocketHandlerService;
  const responses$ = new BehaviorSubject<IncomingMessage | null>(null);
  let mockStore$: MockStore<JobSlice>;

  const jobUpdate = {
    method: 'boot.attach',
    state: JobState.Success,
    time_finished: {
      $date: 123456789,
    },
  } as Job;

  const createService = createServiceFactory({
    service: ApiService,
    providers: [
      mockProvider(WebSocketHandlerService, {
        responses$,
      }),
      mockProvider(SubscriptionManagerService, {
        subscribe: jest.fn(() => of()),
      }),
      provideMockStore({
        selectors: [
          {
            selector: selectJobs,
            value: [jobUpdate],
          },
        ],
      }),
    ],
  });

  beforeEach(() => {
    spectator = createService();
    wsHandler = spectator.inject(WebSocketHandlerService);
    mockStore$ = TestBed.inject<MockStore<JobSlice>>(MockStore<JobSlice>);
    jest.spyOn(spectator.service.clearSubscriptions$, 'next');

    jest.clearAllMocks();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('call', () => {
    it('should make a WS call and get a response', async () => {
      const uuid = 'fakeUUID';
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      jest.spyOn(require('uuid'), 'v4').mockReturnValue(uuid);
      const someResult = {};
      responses$.next({
        jsonrpc: '2.0',
        id: uuid,
        result: someResult,
      });

      const result = await firstValueFrom(spectator.service.call('cloudsync.providers'));

      expect(result).toBe(someResult);
      expect(wsHandler.scheduleCall).toHaveBeenCalled();
    });

    it('should handle WS call errors', async () => {
      jest.spyOn(console, 'error').mockImplementation();
      const uuid = 'fakeUUID';
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      jest.spyOn(require('uuid'), 'v4').mockReturnValue(uuid);

      const someError = {
        message: 'Test Error',
      } as JsonRpcError;
      responses$.next({
        id: uuid,
        jsonrpc: '2.0',
        error: someError,
      });

      const call = firstValueFrom(spectator.service.call('cloudsync.providers'));
      await expect(call).rejects.toBeInstanceOf(ApiCallError);
      await expect(call).rejects.toMatchObject({
        error: someError,
      });
    });

    describe('when the appliance refuses the call for want of a session', () => {
      const uuid = 'fakeUUID';

      /**
       * Subscribes a call that the appliance refuses, and returns the
       * subscription. The call is not awaited: a refusal is swallowed inside a
       * `switchMap`, which leaves the outer chain open rather than completing
       * it, so the caller is left hanging — which is the whole reason ending the
       * session has to bring it back.
       */
      function refuseNextCall(): Subscription {
        // eslint-disable-next-line @typescript-eslint/no-require-imports
        jest.spyOn(require('uuid'), 'v4').mockReturnValue(uuid);
        responses$.next({
          id: uuid,
          jsonrpc: '2.0',
          error: { message: 'Not authenticated', data: { errname: ApiErrorName.NotAuthenticated } } as JsonRpcError,
        });

        return spectator.service.call('cloudsync.providers').subscribe();
      }

      // This socket only borrows its session now, so a refusal means the borrow
      // lapsed and `TypedApiService` re-lends off this signal.
      it('asks for the session to be lent again', () => {
        const lapses: number[] = [];
        const watching = spectator.service.sessionLost.subscribe(() => lapses.push(1));

        const call = refuseNextCall();

        expect(lapses).toHaveLength(1);
        call.unsubscribe();
        watching.unsubscribe();
      });

      // The refused call is dropped, so something has to bring it back: ending
      // the session bounces the tab to /signin and back, which re-issues it.
      // Without this the caller sits on a loading state that never resolves.
      it('ends the session, as the typed socket does for the same refusal', () => {
        const wsStatus = spectator.inject(WebSocketStatusService);
        wsStatus.setSessionStatus(true);
        wsStatus.setLoginStatus(true);
        expect(wsStatus.isAuthenticated).toBe(true);

        const call = refuseNextCall();

        expect(wsStatus.isAuthenticated).toBe(false);
        call.unsubscribe();
      });
    });
  });

  describe('callAndSubscribe', () => {
    it('should call and subscribe to updates', async () => {
      const pools = [{ name: 'pool1' }, { name: 'pool2' }] as Pool[];
      const uuid = 'fakeUUID';
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      jest.spyOn(require('uuid'), 'v4').mockReturnValue(uuid);
      responses$.next({
        jsonrpc: '2.0',
        id: uuid,
        result: pools,
      });

      expect(await firstValueFrom(spectator.service.callAndSubscribe('pool.query'))).toEqual([
        { name: 'pool1' }, { name: 'pool2' },
      ]);
    });
  });

  describe('startJob', () => {
    beforeEach(() => {
      responses$.next({
        id: 'dummy',
        jsonrpc: '2.0',
        result: null,
      });
    });
    it('should schedule a call to start a job and return call id', async () => {
      const uuid = 'fakeUUID10';
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      jest.spyOn(require('uuid'), 'v4').mockReturnValue(uuid);
      const updatedJobUpdate = {
        ...jobUpdate,
        message_ids: [uuid],
        time_finished: undefined,
        id: 123,
      } as Job;
      mockStore$.overrideSelector(selectJobs, [updatedJobUpdate]);
      mockStore$.refreshState();
      const response = await firstValueFrom(spectator.service.startJob('boot.attach', ['something', {}]));

      expect(response).toBe(123);
      expect(wsHandler.scheduleCall).toHaveBeenCalledWith({
        id: expect.any(String),
        method: 'boot.attach',
        params: ['something', {}],
      });
    });
  });

  describe('job', () => {
    it('should subscribe to job updates by observing job from the store', async () => {
      const fakeUuid5 = 'fakeUUID5';
      const mockJobId5 = 5;
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      jest.spyOn(require('uuid'), 'v4').mockReturnValue(fakeUuid5);
      const updatedJobUpdate = {
        ...jobUpdate,
        id: mockJobId5,
        message_ids: [fakeUuid5],
        time_finished: undefined,
      } as Job;
      mockStore$.overrideSelector(selectJobs, [updatedJobUpdate]);
      mockStore$.refreshState();
      const update = await firstValueFrom(spectator.service.job('boot.attach', ['something', {}]));
      responses$.next({
        jsonrpc: '2.0',
        id: fakeUuid5,
        result: mockJobId5,
      });

      expect(update).toEqual(updatedJobUpdate);
    });

    it('should complete via store even when WebSocket response arrives before job finishes in store', () => {
      const fakeUuid = 'fakeUUID-race';
      const mockJobId = 42;
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      jest.spyOn(require('uuid'), 'v4').mockReturnValue(fakeUuid);

      // Start with no matching job in the store
      responses$.next({ id: 'dummy', jsonrpc: '2.0', result: null });
      mockStore$.overrideSelector(selectJobs, []);
      mockStore$.refreshState();

      const emissions: Job[] = [];
      let completed = false;
      spectator.service.job('boot.attach', ['something', {}]).subscribe({
        next: (job) => emissions.push(job),
        complete: () => { completed = true; },
      });

      // WebSocket success response arrives BEFORE the job appears in the store
      responses$.next({ jsonrpc: '2.0', id: fakeUuid, result: mockJobId });

      // Job appears in the store as running
      const runningJob = {
        id: mockJobId,
        method: 'boot.attach',
        message_ids: [fakeUuid],
        state: JobState.Running,
      } as Job;
      mockStore$.overrideSelector(selectJobs, [runningJob]);
      mockStore$.refreshState();

      // Job completes in the store
      const completedJob = {
        id: mockJobId,
        method: 'boot.attach',
        message_ids: [fakeUuid],
        state: JobState.Success,
        time_finished: { $date: 123456789 },
      } as Job;
      mockStore$.overrideSelector(selectJobs, [completedJob]);
      mockStore$.refreshState();

      expect(emissions).toEqual([runningJob, completedJob]);
      expect(completed).toBe(true);
    });

    it('should throw on a failed job', async () => {
      jest.spyOn(console, 'warn').mockImplementation();
      const mockJobId4 = 1237;
      const fakeUuid6 = 'fakeUUID6';
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      jest.spyOn(require('uuid'), 'v4').mockReturnValue(fakeUuid6);
      const failedJobUpdate = {
        id: mockJobId4,
        method: 'boot.attach',
        message_ids: [fakeUuid6],
        state: JobState.Failed,
        time_finished: {
          $date: 123456789,
        },
      };

      mockStore$.overrideSelector(selectJobs, [failedJobUpdate as Job]);
      mockStore$.refreshState();

      await expect(firstValueFrom(spectator.service.job('boot.attach'))).rejects.toBeInstanceOf(FailedJobError);
      await expect(firstValueFrom(spectator.service.job('boot.attach'))).rejects.toMatchObject({
        job: failedJobUpdate,
      });
    });
  });

  describe('subscribe', () => {
    it('should successfully subscribe', () => {
      spectator.service.subscribe('alert.list').subscribe();

      expect(spectator.inject(SubscriptionManagerService).subscribe).toHaveBeenCalledWith('alert.list');
    });
  });

  describe('clearSubscriptions', () => {
    it('should clear all event subscriptions', () => {
      spectator.service.clearSubscriptions();

      // TODO: Poor test. `clearSubscriptions$` should be private and test should actually verify behavior.
      expect(spectator.service.clearSubscriptions$.next).toHaveBeenCalled();
    });
  });
});
