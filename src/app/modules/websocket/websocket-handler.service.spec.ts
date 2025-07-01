import {
  discardPeriodicTasks, fakeAsync, tick,
} from '@angular/core/testing';
import { createServiceFactory, SpectatorService } from '@ngneat/spectator/jest';
import { Subject } from 'rxjs';
import { WebSocketSubject, WebSocketSubjectConfig } from 'rxjs/webSocket';
import { WEBSOCKET } from 'app/helpers/websocket.helper';
import { WebSocketConnection } from 'app/modules/websocket/websocket-connection.class';
import { WebSocketHandlerService } from 'app/modules/websocket/websocket-handler.service';

const fakeSocketUrl = 'ws://localhost:1234';
let fakeSocketConfig: WebSocketSubjectConfig<unknown>;

function fakeSocketFactory<T>(urlConfigOrSource: WebSocketSubjectConfig<T>): WebSocketSubject<unknown> {
  urlConfigOrSource.url = fakeSocketUrl;
  fakeSocketConfig = urlConfigOrSource;
  const fakeSocket$ = new WebSocketSubject<T>(urlConfigOrSource);
  return fakeSocket$;
}

describe('WebSocketHandlerService', () => {
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
    responseStream$ = new Subject();
    jest.spyOn(WebSocketConnection.prototype, 'send');
    jest.spyOn(WebSocketConnection.prototype, 'close');
    jest.spyOn(WebSocketConnection.prototype, 'connect');
    jest.spyOn(WebSocketConnection.prototype, 'stream$', 'get').mockImplementation(() => responseStream$.asObservable());
    spectator = createService();
  });

  it('checks socket config params', () => {
    expect(fakeSocketConfig.url).toBe(fakeSocketUrl);
    expect(typeof fakeSocketConfig.openObserver!.next).toBe('function');
    expect(fakeSocketConfig.openObserver!.next.name).toContain('onOpen');
    expect(typeof fakeSocketConfig.closeObserver!.next).toBe('function');
    expect(fakeSocketConfig.closeObserver!.next.name).toContain('onClose');
  });

  it('sets shutDownInProgress to false when open connection', () => {
    spectator.service.prepareShutdown();
    expect(spectator.service.isSystemShuttingDown).toBe(true);

    fakeSocketConfig.openObserver!.next({} as Event);
    expect(spectator.service.isSystemShuttingDown).toBe(false);
  });

  it('resumes calls that were paused because of broken connection', fakeAsync(() => {
    fakeSocketConfig.openObserver!.next({} as Event);
    spectator.service.scheduleCall({ id: 'message-1', method: 'truenas.get_eula', params: [] });

    fakeSocketConfig.closeObserver!.next({} as CloseEvent);
    spectator.service.scheduleCall({ id: 'message-2', method: 'truenas.is_eula_accepted', params: [] });
    spectator.service.scheduleCall({ id: 'message-3', method: 'truenas.accept_eula', params: [] });

    expect(WebSocketConnection.prototype.send).toHaveBeenCalledWith({
      jsonrpc: '2.0',
      id: 'message-1',
      method: 'truenas.get_eula',
      params: [],
    });
    expect(WebSocketConnection.prototype.send).not.toHaveBeenCalledWith(expect.objectContaining({ id: 'message-2' }));
    expect(WebSocketConnection.prototype.send).not.toHaveBeenCalledWith(expect.objectContaining({ id: 'message-3' }));
    tick(5000);
    fakeSocketConfig.openObserver!.next({} as Event);
    responseStream$.next({ id: 'message-1', result: 'eula' });

    tick(2000);
    expect(WebSocketConnection.prototype.send).toHaveBeenCalledWith({
      jsonrpc: '2.0',
      id: 'message-2',
      method: 'truenas.is_eula_accepted',
      params: [],
    });
    expect(WebSocketConnection.prototype.send).toHaveBeenCalledWith({
      jsonrpc: '2.0',
      id: 'message-3',
      method: 'truenas.accept_eula',
      params: [],
    });
    discardPeriodicTasks();
  }));

  it('sets isAccessRestricted when close connection with code 1008', () => {
    fakeSocketConfig.openObserver!.next({} as Event);

    fakeSocketConfig.closeObserver!.next({ code: 1008 } as CloseEvent);

    let isAccessRestricted;
    spectator.service.isAccessRestricted$.subscribe((value) => isAccessRestricted = value);
    expect(isAccessRestricted).toBe(true);
  });

  it('handles reconnect logic', () => {
    const service: WebSocketHandlerService = spectator.service;

    service.reconnect();

    expect(WebSocketConnection.prototype.close).toHaveBeenCalled();
    expect(WebSocketConnection.prototype.connect).toHaveBeenCalled();
  });
});
