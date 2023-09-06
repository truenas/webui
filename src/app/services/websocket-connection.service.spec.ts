import { discardPeriodicTasks, fakeAsync, tick } from '@angular/core/testing';
import { MatDialog } from '@angular/material/dialog';
import { Router } from '@angular/router';
import { createServiceFactory, mockProvider, SpectatorService } from '@ngneat/spectator/jest';
import { TranslateService } from '@ngx-translate/core';
import { UUID } from 'angular2-uuid';
import { Subject } from 'rxjs';
import { OutgoingApiMessageType } from 'app/enums/api-message-type.enum';
import { WEBSOCKET } from 'app/helpers/websocket.helper';
import { DialogService } from 'app/services/dialog.service';
import { WebsocketConnectionService } from 'app/services/websocket-connection.service';


describe('WebsocketConnectionService', () => {
  let spectator: SpectatorService<WebsocketConnectionService>;
  const fakeSocket$ = new Subject();

  const createService = createServiceFactory({
    service: WebsocketConnectionService,
    providers: [
      mockProvider(Router),
      mockProvider(MatDialog),
      mockProvider(DialogService),
      mockProvider(TranslateService),
      {
        provide: WEBSOCKET,
        useValue: jest.fn(() => fakeSocket$),
      },
    ],
  });

  beforeEach(() => {
    spectator = createService();
  });

  it('sends pings', fakeAsync(() => {
    jest.spyOn(fakeSocket$, 'next');
    jest.spyOn(UUID, 'UUID')
      .mockReturnValueOnce('ping-pong-uuid-1')
      .mockReturnValueOnce('ping-pong-uuid-2')
      .mockReturnValueOnce('ping-pong-uuid-3');

    spectator.service.isConnected$.next(true);

    tick(20 * 1000);
    expect(fakeSocket$.next).toHaveBeenNthCalledWith(1, { id: 'ping-pong-uuid-1', msg: OutgoingApiMessageType.Ping });
    expect(fakeSocket$.next).toHaveBeenCalledTimes(1);
    tick(20 * 1000);
    expect(fakeSocket$.next).toHaveBeenNthCalledWith(2, { id: 'ping-pong-uuid-2', msg: OutgoingApiMessageType.Ping });
    expect(fakeSocket$.next).toHaveBeenCalledTimes(2);
    tick(20 * 1000);
    expect(fakeSocket$.next).toHaveBeenNthCalledWith(3, { id: 'ping-pong-uuid-3', msg: OutgoingApiMessageType.Ping });
    expect(fakeSocket$.next).toHaveBeenCalledTimes(3);

    spectator.service.isConnected$.next(false);
    tick(20 * 1000);
    expect(fakeSocket$.next).toHaveBeenCalledTimes(3);

    discardPeriodicTasks();
  }));
});
