import { TestBed } from '@angular/core/testing';
import { mockProvider } from '@ngneat/spectator/jest';
import { TranslateService } from '@ngx-translate/core';
import { UUID } from 'angular2-uuid';
import {
  BehaviorSubject, Observable,
  Subject,
  firstValueFrom,
} from 'rxjs';
import { IncomingApiMessageType } from 'app/enums/api-message-type.enum';
import { JobState } from 'app/enums/job-state.enum';
import { ApiEvent } from 'app/interfaces/api-message.interface';
import { Pool } from 'app/interfaces/pool.interface';
import { ApiService } from 'app/services/api.service';
import { WebSocketConnectionService } from 'app/services/websocket-connection.service';

const mockWebSocketConnectionService = {
  send: jest.fn(),
  buildSubscriber: jest.fn().mockReturnValue(new Subject<unknown>()),
  websocket$: new BehaviorSubject<unknown>(null),
};

const apiEventSubscription1$ = new BehaviorSubject(null);
const apiEventSubscription2$ = new BehaviorSubject(null);

const mockEventSubscriptions = new Map<string, Observable<ApiEvent>>([
  ['event1', apiEventSubscription1$],
  ['event2', apiEventSubscription2$],
]);

describe('ApiService', () => {
  let service: ApiService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        ApiService,
        mockProvider(TranslateService),
        { provide: WebSocketConnectionService, useValue: mockWebSocketConnectionService },
      ],
    });

    service = TestBed.inject(ApiService);

    jest.spyOn(service.clearSubscriptions$, 'next');

    (service as unknown as {
      eventSubscribers: Map<string, Observable<ApiEvent>>;
    }).eventSubscribers = mockEventSubscriptions;

    jest.clearAllMocks();
  });

  describe('call', () => {
    it('should make a WS call and get a response', () => {
      const uuid = 'fakeUUID';
      jest.spyOn(UUID, 'UUID').mockReturnValue(uuid);
      mockWebSocketConnectionService.websocket$.next({
        id: uuid,
        msg: IncomingApiMessageType.Result,
        result: {},
      });

      service.call('cloudsync.providers').subscribe((result) => {
        // TODO: Actually do nothing
        expect(result).toEqual({});
      });

      expect(mockWebSocketConnectionService.send).toHaveBeenCalled();
    });

    it('should handle WS call errors', () => {
      jest.spyOn(console, 'error').mockImplementation();
      const uuid = 'fakeUUID';
      jest.spyOn(UUID, 'UUID').mockReturnValue(uuid);
      mockWebSocketConnectionService.websocket$.next({
        id: uuid,
        msg: IncomingApiMessageType.Result,
        error: 'Test Error',
      });

      service.call('cloudsync.providers').subscribe(
        {
          next: () => {},
          error: (error) => {
            expect(error).toBe('Test Error');
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
      mockWebSocketConnectionService.websocket$.next({
        id: uuid,
        msg: IncomingApiMessageType.Result,
        result: pools,
      });

      expect(await firstValueFrom(service.callAndSubscribe('pool.query'))).toEqual([
        { name: 'pool1' }, { name: 'pool2' },
      ]);
    });
  });

  describe('job', () => {
    it('should start a job successfully', () => {
      const uuid = 'fakeUUID';
      const mockJobId = 1234;
      jest.spyOn(UUID, 'UUID').mockReturnValue(uuid);
      mockWebSocketConnectionService.websocket$.next({
        id: uuid,
        msg: IncomingApiMessageType.Result,
        result: mockJobId,
      });

      service.startJob('boot.attach').subscribe((response) => {
        expect(response).toEqual(mockJobId);
      });
    });

    it('should handle a successful job', () => {
      service.job('boot.attach').subscribe((result) => {
        expect(result.state).toEqual(JobState.Failed);
      });
    });
  });

  describe('subscribe', () => {
    it('should successfully subscribe', () => {
      const eventData = { data: 'test' };
      (mockWebSocketConnectionService.buildSubscriber() as Subject<unknown>).next(eventData);

      service.subscribe('alert.list').subscribe((data) => {
        // TODO: Actually do nothing
        expect(data).toEqual({});
      });

      expect(mockWebSocketConnectionService.buildSubscriber).toHaveBeenCalled();
    });
  });

  describe('subscribeToLogs', () => {
    it('should successfully subscribe to logs', () => {
      const logData = { data: 'log test' };
      (mockWebSocketConnectionService.buildSubscriber() as Subject<unknown>).next(logData);

      service.subscribeToLogs('logName').subscribe((data) => {
        // TODO: Actually do nothing
        expect(data).toEqual({});
      });
    });
  });

  describe('clearSubscriptions', () => {
    it('should clear all event subscriptions', () => {
      service.clearSubscriptions();

      expect(service.clearSubscriptions$.next).toHaveBeenCalled();
      expect(mockEventSubscriptions.size).toBe(0);
    });
  });
});
