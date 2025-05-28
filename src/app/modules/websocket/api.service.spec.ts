import { TestBed } from '@angular/core/testing';
import { createServiceFactory, mockProvider, SpectatorService } from '@ngneat/spectator/jest';
import { MockStore, provideMockStore } from '@ngrx/store/testing';
import { UUID } from 'angular2-uuid';
import {
  BehaviorSubject,
  firstValueFrom, of,
} from 'rxjs';
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

describe('ApiService', () => {
  let spectator: SpectatorService<ApiService>;
  let wsHandler: WebSocketHandlerService;
  const responses$ = new BehaviorSubject<IncomingMessage | null>(null);
  let mockStore$: MockStore<JobSlice>;

  const jobUpdate = {
    method: 'boot.attach',
    state: JobState.Finished,
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

  describe('call', () => {
    it('should make a WS call and get a response', async () => {
      const uuid = 'fakeUUID';
      jest.spyOn(UUID, 'UUID').mockReturnValue(uuid);
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
      jest.spyOn(UUID, 'UUID').mockReturnValue(uuid);

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
  });

  describe('callAndSubscribe', () => {
    it('should call and subscribe to updates', async () => {
      const pools = [{ name: 'pool1' }, { name: 'pool2' }] as Pool[];
      const uuid = 'fakeUUID';
      jest.spyOn(UUID, 'UUID').mockReturnValue(uuid);
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
    it('should schedule a call to start a job and return call id', async () => {
      const uuid = 'fakeUUID10';
      jest.spyOn(UUID, 'UUID').mockReturnValue(uuid);
      responses$.next({
        id: uuid,
        jsonrpc: '2.0',
        result: true,
      });
      const response = await firstValueFrom(spectator.service.startJob('boot.attach', ['something', {}]));

      expect(response).toBeTruthy();
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
      jest.spyOn(UUID, 'UUID').mockReturnValue(fakeUuid5);
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

    it('should throw on a failed job', async () => {
      const mockJobId4 = 1237;
      const fakeUuid6 = 'fakeUUID6';
      jest.spyOn(UUID, 'UUID').mockReturnValue(fakeUuid6);
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
