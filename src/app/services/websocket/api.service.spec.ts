import { createServiceFactory, mockProvider, SpectatorService } from '@ngneat/spectator/jest';
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
import { Pool } from 'app/interfaces/pool.interface';
import { ApiService } from 'app/services/websocket/api.service';
import { SubscriptionManagerService } from 'app/services/websocket/subscription-manager.service';
import { WebSocketHandlerService } from 'app/services/websocket/websocket-handler.service';

describe('ApiService', () => {
  let spectator: SpectatorService<ApiService>;
  let wsHandler: WebSocketHandlerService;
  const responses$ = new BehaviorSubject<IncomingMessage>(null);

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
    it('should make a WS call and get a response', () => {
      const uuid = 'fakeUUID';
      jest.spyOn(UUID, 'UUID').mockReturnValue(uuid);
      const someResult = {};
      responses$.next({
        jsonrpc: '2.0',
        id: uuid,
        result: someResult,
      });

      spectator.service.call('cloudsync.providers').subscribe((result) => {
        expect(result).toBe(someResult);
      });

      expect(wsHandler.scheduleCall).toHaveBeenCalled();
    });

    it('should handle WS call errors', () => {
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

      spectator.service.call('cloudsync.providers').subscribe(
        {
          next: () => {},
          error: (error: unknown) => {
            expect(error).toBe(someError);
          },
        },
      );
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

  describe('job', () => {
    it('should start a job successfully', () => {
      const uuid = 'fakeUUID';
      const mockJobId = 1234;
      jest.spyOn(UUID, 'UUID').mockReturnValue(uuid);
      responses$.next({
        jsonrpc: '2.0',
        id: uuid,
        result: mockJobId,
      });

      spectator.service.startJob('boot.attach').subscribe((response) => {
        expect(response).toEqual(mockJobId);
      });
    });

    it('should handle a successful job', () => {
      spectator.service.job('boot.attach').subscribe((result) => {
        expect(result.state).toEqual(JobState.Failed);
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
