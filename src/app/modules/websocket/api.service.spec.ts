import { createServiceFactory, mockProvider, SpectatorService } from '@ngneat/spectator/jest';
import { UUID } from 'angular2-uuid';
import {
  BehaviorSubject,
  firstValueFrom, of,
} from 'rxjs';
import { JobState } from 'app/enums/job-state.enum';
import {
  ApiEventTyped,
  IncomingMessage,
  JsonRpcError,
} from 'app/interfaces/api-message.interface';
import { Pool } from 'app/interfaces/pool.interface';
import { ApiService } from 'app/modules/websocket/api.service';
import { SubscriptionManagerService } from 'app/modules/websocket/subscription-manager.service';
import { WebSocketHandlerService } from 'app/modules/websocket/websocket-handler.service';
import { ApiCallError, FailedJobError } from 'app/services/errors/error.classes';

describe('ApiService', () => {
  let spectator: SpectatorService<ApiService>;
  let wsHandler: WebSocketHandlerService;
  const responses$ = new BehaviorSubject<IncomingMessage | null>(null);

  const createService = createServiceFactory({
    service: ApiService,
    providers: [
      mockProvider(WebSocketHandlerService, {
        responses$,
        scheduleCall: jest.fn(),
      }),
      mockProvider(SubscriptionManagerService, {
        subscribe: jest.fn(() => of()),
      }),
    ],
  });

  beforeEach(() => {
    spectator = createService();
    wsHandler = spectator.inject(WebSocketHandlerService);

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
    const uuid = 'fakeUUID';
    const mockJobId = 1234;

    beforeEach(() => {
      jest.spyOn(UUID, 'UUID').mockReturnValue(uuid);
      responses$.next({
        jsonrpc: '2.0',
        id: uuid,
        result: mockJobId,
      });
    });

    it('should schedule a call to start a job and return job id', async () => {
      const response = await firstValueFrom(spectator.service.startJob('boot.attach', ['something', {}]));

      expect(response).toBe(1234);
      expect(wsHandler.scheduleCall).toHaveBeenCalledWith({
        id: expect.any(String),
        method: 'boot.attach',
        params: ['something', {}],
      });
    });
  });

  describe('job', () => {
    const uuid = 'fakeUUID';
    const mockJobId = 1234;
    const jobUpdate = {
      id: mockJobId,
      method: 'boot.attach',
      state: JobState.Finished,
      time_finished: {
        $date: 123456789,
      },
    };

    beforeEach(() => {
      jest.spyOn(UUID, 'UUID').mockReturnValue(uuid);

      jest.spyOn(wsHandler, 'scheduleCall').mockImplementation((call) => {
        if (call.method === 'boot.attach') {
          responses$.next({
            jsonrpc: '2.0',
            id: uuid,
            result: mockJobId,
          });
        } else if (call.method === 'core.get_jobs') {
          responses$.next({
            jsonrpc: '2.0',
            id: uuid,
            result: [
              jobUpdate,
            ],
          });
        }
      });
    });

    it('should schedule a call to start a job', async () => {
      await firstValueFrom(spectator.service.startJob('boot.attach', ['something', {}]));

      expect(wsHandler.scheduleCall).toHaveBeenCalledWith({
        id: expect.any(String),
        method: 'boot.attach',
        params: ['something', {}],
      });
    });

    it('should subscribe to job updates by calling subscription manager for core.get_jobs', async () => {
      await firstValueFrom(spectator.service.job('boot.attach', ['something', {}]));

      expect(spectator.inject(SubscriptionManagerService).subscribe).toHaveBeenCalledWith('core.get_jobs');
    });

    it('should also call core.get_jobs in case job completes too quickly', async () => {
      await firstValueFrom(spectator.service.job('boot.attach', ['something', {}]));

      expect(wsHandler.scheduleCall).toHaveBeenCalledWith({
        id: expect.any(String),
        method: 'core.get_jobs',
        params: [[['id', '=', mockJobId]]],
      });
    });

    it('should return a job update when it is received', async () => {
      jest.spyOn(spectator.service, 'subscribe').mockReturnValue(of({
        id: mockJobId,
        fields: jobUpdate,
      } as ApiEventTyped<'core.get_jobs'>));

      const response = await firstValueFrom(spectator.service.job('boot.attach', ['something', {}]));
      expect(response).toEqual(jobUpdate);
    });

    it('should throw on a failed job', async () => {
      const faileJobUpdate = {
        id: mockJobId,
        method: 'boot.attach',
        state: JobState.Failed,
        time_finished: {
          $date: 123456789,
        },
      };

      jest.spyOn(spectator.service, 'subscribe').mockReturnValue(of({
        id: mockJobId,
        fields: faileJobUpdate,
      } as ApiEventTyped<'core.get_jobs'>));

      await expect(firstValueFrom(spectator.service.job('boot.attach'))).rejects.toBeInstanceOf(FailedJobError);
      await expect(firstValueFrom(spectator.service.job('boot.attach'))).rejects.toMatchObject({
        job: faileJobUpdate,
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
