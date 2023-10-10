import { TestBed } from '@angular/core/testing';
import { RouterTestingModule } from '@angular/router/testing';
import { UUID } from 'angular2-uuid';
import {
  BehaviorSubject, Observable, Subject, of,
} from 'rxjs';
import { IncomingApiMessageType } from 'app/enums/api-message-type.enum';
import { JobState } from 'app/enums/job-state.enum';
import { WebsocketConnectionService } from 'app/services/websocket-connection.service';
import { WebSocketService } from 'app/services/ws.service';

const mockWebsocketConnectionService = {
  send: jest.fn(),
  buildSubscriber: jest.fn().mockReturnValue(new Subject<unknown>()),
  websocket$: new BehaviorSubject<unknown>(null),
};

const mockTakeUntil1$ = new Subject<void>();
const mockTakeUntil2$ = new Subject<void>();
const mockEventSubscriptions = new Map<string, { obs$: Observable<unknown>; takeUntil$: Subject<void> }>([
  ['event1', { obs$: new BehaviorSubject(null), takeUntil$: mockTakeUntil1$ }],
  ['event2', { obs$: new BehaviorSubject(null), takeUntil$: mockTakeUntil2$ }],
]);

describe('WebSocketService', () => {
  let service: WebSocketService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [RouterTestingModule],
      providers: [
        WebSocketService,
        { provide: WebsocketConnectionService, useValue: mockWebsocketConnectionService },
      ],
    });

    service = TestBed.inject(WebSocketService);

    (service as unknown as {
      eventSubscriptions: Map<string, {
        obs$: Observable<unknown>;
        takeUntil$: Subject<void>;
      }>;
    }).eventSubscriptions = mockEventSubscriptions;

    jest.clearAllMocks();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  describe('call', () => {
    it('should make a WS call and get a response', () => {
      const uuid = 'fakeUUID';
      jest.spyOn(UUID, 'UUID').mockReturnValue(uuid);
      mockWebsocketConnectionService.websocket$.next({
        id: uuid,
        msg: IncomingApiMessageType.Result,
        result: {},
      });

      service.call('cloudsync.providers').subscribe((result) => {
        expect(result).toEqual({});
      });

      expect(mockWebsocketConnectionService.send).toHaveBeenCalled();
    });

    it('should handle WS call errors', () => {
      const uuid = 'fakeUUID';
      jest.spyOn(UUID, 'UUID').mockReturnValue(uuid);
      mockWebsocketConnectionService.websocket$.next({
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
    it('should handle scenarios where jobId is not a number', () => {
      return new Promise((done) => {
        jest.spyOn(service, 'call').mockReturnValue(of('notANumber'));

        service.job('activedirectory.config').subscribe(
          {
            next: () => {},
            error: (err: Error) => {
              expect(err.message).toBe('activedirectory.config did not return a job id. You may be calling ws.job when ws.call was expected.');
              done(null);
            },
          },
        );
      });
    });

    it('should handle a successful job', () => {
      jest.spyOn(service, 'call').mockReturnValue(of(1));

      service.job('cloudsync.providers').subscribe((result) => {
        expect(result.state).toEqual(JobState.Success);
      });
    });
  });

  describe('subscribe', () => {
    it('should successfully subscribe', () => {
      const eventData = { data: 'test' };
      (mockWebsocketConnectionService.buildSubscriber() as Subject<unknown>).next(eventData);

      service.subscribe('alert.list').subscribe((data) => {
        expect(data).toEqual(eventData);
      });

      expect(mockWebsocketConnectionService.buildSubscriber).toHaveBeenCalled();
    });
  });

  describe('subscribeToLogs', () => {
    it('should successfully subscribe to logs', () => {
      const logData = { data: 'log test' };
      (mockWebsocketConnectionService.buildSubscriber() as Subject<unknown>).next(logData);

      service.subscribeToLogs('logName').subscribe((data) => {
        expect(data).toEqual(logData);
      });
    });
  });

  describe('clearSubscriptions', () => {
    it('should clear all event subscriptions', () => {
      const spy1 = jest.spyOn(mockTakeUntil1$, 'next');
      const spy2 = jest.spyOn(mockTakeUntil2$, 'next');

      service.clearSubscriptions();

      expect(spy1).toHaveBeenCalled();
      expect(spy2).toHaveBeenCalled();

      expect(mockEventSubscriptions.size).toBe(0);
    });
  });
});
