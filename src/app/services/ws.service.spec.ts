import { TestBed } from '@angular/core/testing';
import { mockProvider } from '@ngneat/spectator/jest';
import { TranslateService } from '@ngx-translate/core';
import { UUID } from 'angular2-uuid';
import {
  BehaviorSubject, Subject,
} from 'rxjs';
import { IncomingApiMessageType } from 'app/enums/api-message-type.enum';
import { JobState } from 'app/enums/job-state.enum';
import { WebSocketConnectionService } from 'app/services/websocket-connection.service';
import { ApiEventSubscription, WebSocketService } from 'app/services/ws.service';

const mockWebSocketConnectionService = {
  send: jest.fn(),
  buildSubscriber: jest.fn().mockReturnValue(new Subject<unknown>()),
  websocket$: new BehaviorSubject<unknown>(null),
};

const apiEventSubscription1$ = new BehaviorSubject(null);
const apiEventSubscription2$ = new BehaviorSubject(null);

const mockEventSubscriptions = new Map<string, ApiEventSubscription>([
  ['event1', apiEventSubscription1$],
  ['event2', apiEventSubscription2$],
]);

describe('WebSocketService', () => {
  let service: WebSocketService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        WebSocketService,
        mockProvider(TranslateService),
        { provide: WebSocketConnectionService, useValue: mockWebSocketConnectionService },
      ],
    });

    service = TestBed.inject(WebSocketService);

    jest.spyOn(service.clearSubscriptions$, 'next');

    (service as unknown as {
      eventSubscriptions: Map<string, ApiEventSubscription>;
    }).eventSubscriptions = mockEventSubscriptions;

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
        expect(data).toEqual(eventData);
      });

      expect(mockWebSocketConnectionService.buildSubscriber).toHaveBeenCalled();
    });
  });

  describe('subscribeToLogs', () => {
    it('should successfully subscribe to logs', () => {
      const logData = { data: 'log test' };
      (mockWebSocketConnectionService.buildSubscriber() as Subject<unknown>).next(logData);

      service.subscribeToLogs('logName').subscribe((data) => {
        expect(data).toEqual(logData);
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
