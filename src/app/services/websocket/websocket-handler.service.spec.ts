import {
  discardPeriodicTasks, fakeAsync, tick,
} from '@angular/core/testing';
import { createServiceFactory, SpectatorService } from '@ngneat/spectator/jest';
import { UUID } from 'angular2-uuid';
import { Subject } from 'rxjs';
import { WebSocketSubject, WebSocketSubjectConfig } from 'rxjs/webSocket';
import { IncomingApiMessageType, OutgoingApiMessageType } from 'app/enums/api-message-type.enum';
import { WEBSOCKET } from 'app/helpers/websocket.helper';
import { WebSocketConnection } from 'app/services/websocket/websocket-connection.class';
import { WebSocketHandlerService } from 'app/services/websocket/websocket-handler.service';

const fakeSocketUrl = 'ws://localhost:1234';
let fakeSocketConfig: WebSocketSubjectConfig<unknown>;
let fakeSocketsList: WebSocketSubject<unknown>[];

function fakeSocketFactory<T>(urlConfigOrSource: WebSocketSubjectConfig<T>): WebSocketSubject<unknown> {
  urlConfigOrSource.url = fakeSocketUrl;
  fakeSocketConfig = urlConfigOrSource;
  const fakeSocket$ = new WebSocketSubject<T>(urlConfigOrSource);
  fakeSocketsList.push(fakeSocket$);
  return fakeSocket$;
}

describe('WebSocketConnectionService', () => {
  let spectator: SpectatorService<WebSocketHandlerService>;
  let responseStream$: Subject<unknown>;

  const createService = createServiceFactory({
    service: WebSocketHandlerService,
    providers: [
      {
        provide: WEBSOCKET,
        useFactory: () => fakeSocketFactory,
      },
    ],
  });

  beforeEach(() => {
    fakeSocketsList = [];
    responseStream$ = new Subject();
    jest.spyOn(WebSocketConnection.prototype, 'send');
    jest.spyOn(WebSocketConnection.prototype, 'close');
    jest.spyOn(WebSocketConnection.prototype, 'stream$', 'get').mockImplementation(() => responseStream$.asObservable());
    spectator = createService();
  });

  it('checks socket config params', () => {
    expect(fakeSocketConfig.url).toBe(fakeSocketUrl);
    expect(typeof fakeSocketConfig.openObserver.next).toBe('function');
    expect(fakeSocketConfig.openObserver.next.name).toContain('onOpen');
    expect(typeof fakeSocketConfig.closeObserver.next).toBe('function');
    expect(fakeSocketConfig.closeObserver.next.name).toContain('onClose');
  });

  it('sets shutDownInProgress to false when open connection', () => {
    spectator.service.prepareShutdown();
    expect(spectator.service.isSystemShuttingDown).toBe(true);

    fakeSocketConfig.openObserver.next({} as Event);
    expect(spectator.service.isSystemShuttingDown).toBe(false);
  });

  it('sends connect message', () => {
    fakeSocketConfig.openObserver.next({} as Event);

    expect(WebSocketConnection.prototype.send).toHaveBeenCalledWith({ support: ['1'], version: '1', msg: OutgoingApiMessageType.Connect });
  });

  it('closes connection when isTryingReconnect is true', fakeAsync(() => {
    fakeSocketConfig.openObserver.next({} as Event);
    spectator.service.prepareShutdown();
    fakeSocketConfig.closeObserver.next({} as CloseEvent);
    tick(3 * 1000);
    fakeSocketConfig.openObserver.next({} as Event);
    spectator.service.scheduleCall({ id: 'test', method: 'test-method' });

    expect(spectator.service.isSystemShuttingDown).toBe(true);
    expect(WebSocketConnection.prototype.send).not.toHaveBeenCalledWith({ id: 'test', method: 'test-method' });
    expect(WebSocketConnection.prototype.close).toHaveBeenCalled();

    discardPeriodicTasks();
  }));

  it('sends pings', fakeAsync(() => {
    jest.spyOn(UUID, 'UUID')
      .mockReturnValueOnce('ping-pong-uuid-1')
      .mockReturnValueOnce('ping-pong-uuid-2')
      .mockReturnValueOnce('ping-pong-uuid-3');

    fakeSocketConfig.openObserver.next({} as Event);
    responseStream$.next({ msg: IncomingApiMessageType.Connected });

    tick(20 * 1000);
    expect(WebSocketConnection.prototype.send).toHaveBeenNthCalledWith(2, { id: 'ping-pong-uuid-1', msg: OutgoingApiMessageType.Ping });
    expect(WebSocketConnection.prototype.send).toHaveBeenCalledTimes(2);
    tick(20 * 1000);
    expect(WebSocketConnection.prototype.send).toHaveBeenNthCalledWith(3, { id: 'ping-pong-uuid-2', msg: OutgoingApiMessageType.Ping });
    expect(WebSocketConnection.prototype.send).toHaveBeenCalledTimes(3);
    tick(20 * 1000);
    expect(WebSocketConnection.prototype.send).toHaveBeenNthCalledWith(4, { id: 'ping-pong-uuid-3', msg: OutgoingApiMessageType.Ping });
    expect(WebSocketConnection.prototype.send).toHaveBeenCalledTimes(4);

    fakeSocketConfig.closeObserver.next({} as CloseEvent);
    tick(20 * 1000);
    expect(WebSocketConnection.prototype.send).toHaveBeenCalledTimes(4);

    discardPeriodicTasks();
  }));

  it('resumes calls that were paused because of broken connection', fakeAsync(() => {
    fakeSocketConfig.openObserver.next({} as Event);
    responseStream$.next({ msg: IncomingApiMessageType.Connected });
    spectator.service.scheduleCall({ id: 'message-1', method: 'message-1' });

    fakeSocketConfig.closeObserver.next({} as CloseEvent);
    spectator.service.scheduleCall({ id: 'message-2', method: 'message-2' });
    spectator.service.scheduleCall({ id: 'message-3', method: 'message-3' });

    expect(WebSocketConnection.prototype.send).toHaveBeenCalledWith({ id: 'message-1', method: 'message-1' });
    expect(WebSocketConnection.prototype.send).not.toHaveBeenCalledWith({ id: 'message-2', method: 'message-2' });
    expect(WebSocketConnection.prototype.send).not.toHaveBeenCalledWith({ id: 'message-3', method: 'message-3' });
    tick(5000);
    fakeSocketConfig.openObserver.next({} as Event);
    responseStream$.next({ msg: IncomingApiMessageType.Connected });

    tick(2000);
    expect(WebSocketConnection.prototype.send).toHaveBeenCalledWith({ id: 'message-2', method: 'message-2' });
    expect(WebSocketConnection.prototype.send).toHaveBeenCalledWith({ id: 'message-3', method: 'message-3' });
    discardPeriodicTasks();
  }));

  it('sets isClosed when close connection and isTryingReconnect is false', () => {
    fakeSocketConfig.openObserver.next({} as Event);
    responseStream$.next({ id: 'test', msg: IncomingApiMessageType.Connected });

    fakeSocketConfig.closeObserver.next({ code: 1006 } as CloseEvent);

    let isClosed;
    spectator.service.isClosed$.subscribe((value) => isClosed = value);
    expect(isClosed).toBe(true);
  });

  it('sets isAccessRestricted when close connection with code 1008', () => {
    fakeSocketConfig.openObserver.next({} as Event);
    responseStream$.next({ id: 'test', msg: IncomingApiMessageType.Connected });

    fakeSocketConfig.closeObserver.next({ code: 1008 } as CloseEvent);

    let isAccessRestricted;
    spectator.service.isAccessRestricted$.subscribe((value) => isAccessRestricted = value);
    expect(isAccessRestricted).toBe(true);
  });

  it('trying to reconnect when close connection and isTryingReconnect is false', fakeAsync(() => {
    jest.spyOn(fakeSocketsList[0], 'complete');
    fakeSocketConfig.openObserver.next({} as Event);
    responseStream$.next({ id: 'test', msg: IncomingApiMessageType.Connected });

    fakeSocketConfig.closeObserver.next({ code: 1006 } as CloseEvent);
    expect(fakeSocketsList).toHaveLength(1);

    tick(5 * 1000);
    expect(fakeSocketsList).toHaveLength(2);

    expect(fakeSocketsList[0].complete).toHaveBeenCalled();

    discardPeriodicTasks();
  }));

  it('ignores closing when close connection and isTryingReconnect is true', fakeAsync(() => {
    jest.spyOn(fakeSocketsList[0], 'complete');
    fakeSocketConfig.openObserver.next({} as Event);
    responseStream$.next({ id: 'test', msg: IncomingApiMessageType.Connected });

    fakeSocketConfig.closeObserver.next({ code: 1006 } as CloseEvent);
    tick(3 * 1000);
    fakeSocketConfig.closeObserver.next({ code: 1006 } as CloseEvent);

    expect(fakeSocketsList).toHaveLength(1);
    expect(fakeSocketsList[0].complete).not.toHaveBeenCalled();

    let isClosed;
    spectator.service.isClosed$.subscribe((value) => isClosed = value);
    expect(isClosed).toBe(true);

    discardPeriodicTasks();
  }));
});
