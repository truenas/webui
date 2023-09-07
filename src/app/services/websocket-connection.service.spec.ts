import { discardPeriodicTasks, fakeAsync, tick } from '@angular/core/testing';
import { MatDialog } from '@angular/material/dialog';
import { Router } from '@angular/router';
import { createServiceFactory, mockProvider, SpectatorService } from '@ngneat/spectator/jest';
import { TranslateService } from '@ngx-translate/core';
import { UUID } from 'angular2-uuid';
import { WebSocketSubject, WebSocketSubjectConfig } from 'rxjs/webSocket';
import { OutgoingApiMessageType } from 'app/enums/api-message-type.enum';
import { WEBSOCKET } from 'app/helpers/websocket.helper';
import { DialogService } from 'app/services/dialog.service';
import { WebsocketConnectionService } from 'app/services/websocket-connection.service';

const fakeSocketUrl = 'ws://localhost:1234';
let fakeSocketConfig: WebSocketSubjectConfig<unknown>;
let fakeSocketsList: WebSocketSubject<unknown>[];

function fakeSocket<T>(urlConfigOrSource: WebSocketSubjectConfig<T>): WebSocketSubject<unknown> {
  urlConfigOrSource.url = fakeSocketUrl;
  fakeSocketConfig = urlConfigOrSource;
  const fakeSocket$ = new WebSocketSubject<T>(urlConfigOrSource);
  fakeSocketsList.push(fakeSocket$);
  return fakeSocket$;
}

describe('WebsocketConnectionService', () => {
  let spectator: SpectatorService<WebsocketConnectionService>;
  let nextFakeSocket$: WebSocketSubject<unknown>;

  const createService = createServiceFactory({
    service: WebsocketConnectionService,
    providers: [
      mockProvider(Router),
      mockProvider(MatDialog, {
        openDialogs: [],
      }),
      mockProvider(DialogService),
      mockProvider(TranslateService),
      {
        provide: WEBSOCKET,
        useFactory: () => fakeSocket,
      },
    ],
  });

  beforeEach(() => {
    fakeSocketsList = [];
    spectator = createService();
    if (fakeSocketsList.length) {
      nextFakeSocket$ = fakeSocketsList[fakeSocketsList.length - 1];
    }
  });

  it('checks socket config params', () => {
    expect(fakeSocketConfig.url).toBe(fakeSocketUrl);
    expect(typeof fakeSocketConfig.openObserver.next).toBe('function');
    expect(fakeSocketConfig.openObserver.next.name).toContain('onOpen');
    expect(typeof fakeSocketConfig.closeObserver.next).toBe('function');
    expect(fakeSocketConfig.closeObserver.next.name).toContain('onClose');
  });

  it('sets shutDownInProgress to false when open connection', () => {
    spectator.service.shutDownInProgress = true;
    expect(spectator.service.shutDownInProgress).toBe(true);

    fakeSocketConfig.openObserver.next({} as Event);
    expect(spectator.service.shutDownInProgress).toBe(false);
  });

  it('sends connect message', () => {
    jest.spyOn(nextFakeSocket$, 'next');
    fakeSocketConfig.openObserver.next({} as Event);

    expect(nextFakeSocket$.next).toHaveBeenCalledWith({ support: ['1'], version: '1', msg: OutgoingApiMessageType.Connect });
  });

  it('closes connection when isTryingReconnect is true', () => {
    jest.spyOn(nextFakeSocket$, 'next');
    jest.spyOn(nextFakeSocket$, 'complete');

    spectator.service.isTryingReconnect = true;
    spectator.service.shutDownInProgress = true;

    fakeSocketConfig.openObserver.next({} as Event);
    expect(spectator.service.shutDownInProgress).toBe(true);
    expect(nextFakeSocket$.next).not.toHaveBeenCalled();
    expect(nextFakeSocket$.complete).toHaveBeenCalled();
  });

  it('sends pings', fakeAsync(() => {
    jest.spyOn(nextFakeSocket$, 'next');
    jest.spyOn(UUID, 'UUID')
      .mockReturnValueOnce('ping-pong-uuid-1')
      .mockReturnValueOnce('ping-pong-uuid-2')
      .mockReturnValueOnce('ping-pong-uuid-3');

    spectator.service.isConnected$.next(true);

    tick(20 * 1000);
    expect(nextFakeSocket$.next).toHaveBeenNthCalledWith(1, { id: 'ping-pong-uuid-1', msg: OutgoingApiMessageType.Ping });
    expect(nextFakeSocket$.next).toHaveBeenCalledTimes(1);
    tick(20 * 1000);
    expect(nextFakeSocket$.next).toHaveBeenNthCalledWith(2, { id: 'ping-pong-uuid-2', msg: OutgoingApiMessageType.Ping });
    expect(nextFakeSocket$.next).toHaveBeenCalledTimes(2);
    tick(20 * 1000);
    expect(nextFakeSocket$.next).toHaveBeenNthCalledWith(3, { id: 'ping-pong-uuid-3', msg: OutgoingApiMessageType.Ping });
    expect(nextFakeSocket$.next).toHaveBeenCalledTimes(3);

    spectator.service.isConnected$.next(false);
    tick(20 * 1000);
    expect(nextFakeSocket$.next).toHaveBeenCalledTimes(3);

    discardPeriodicTasks();
  }));

  it('redirect to signin page when close connection and isTryingReconnect is false', () => {
    fakeSocketConfig.openObserver.next({} as Event);
    spectator.service.isConnected$.next(true);

    fakeSocketConfig.closeObserver.next({ code: 1006 } as CloseEvent);
    expect(spectator.inject(Router).navigate).toHaveBeenCalledWith(['/sessions/signin']);
  });

  it('trying to reconnect when close connection and isTryingReconnect is false', fakeAsync(() => {
    jest.spyOn(fakeSocketsList[0], 'complete');
    fakeSocketConfig.openObserver.next({} as Event);
    spectator.service.isConnected$.next(true);

    fakeSocketConfig.closeObserver.next({ code: 1006 } as CloseEvent);
    expect(spectator.service.isTryingReconnect).toBe(true);
    expect(fakeSocketsList).toHaveLength(1);

    tick(5 * 1000);
    expect(spectator.service.isTryingReconnect).toBe(false);
    expect(fakeSocketsList).toHaveLength(2);

    expect(fakeSocketsList[0].complete).toHaveBeenCalled();

    discardPeriodicTasks();
  }));

  it('ignores closing when close connection and isTryingReconnect is true', fakeAsync(() => {
    jest.spyOn(fakeSocketsList[0], 'complete');
    fakeSocketConfig.openObserver.next({} as Event);
    spectator.service.isConnected$.next(true);
    spectator.service.isTryingReconnect = true;

    fakeSocketConfig.closeObserver.next({ code: 1006 } as CloseEvent);
    tick(5 * 1000);

    expect(fakeSocketsList).toHaveLength(1);
    expect(fakeSocketsList[0].complete).not.toHaveBeenCalled();
    expect(spectator.inject(Router).navigate).not.toHaveBeenCalledWith(['/sessions/signin']);

    discardPeriodicTasks();
  }));
});
