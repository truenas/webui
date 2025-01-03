import { discardPeriodicTasks, fakeAsync, tick } from '@angular/core/testing';
import { createServiceFactory, mockProvider, SpectatorService } from '@ngneat/spectator/jest';
import { BehaviorSubject, of } from 'rxjs';
import { PingService } from 'app/modules/websocket/ping.service';
import { WebSocketHandlerService } from 'app/modules/websocket/websocket-handler.service';
import { WebSocketStatusService } from 'app/services/websocket-status.service';

describe('PingService', () => {
  let spectator: SpectatorService<PingService>;
  let wsHandler: WebSocketHandlerService;
  const isAuthenticated$ = new BehaviorSubject(false);

  const createService = createServiceFactory({
    service: PingService,
    providers: [
      mockProvider(WebSocketHandlerService, {
        scheduleCall: jest.fn(),
      }),
      mockProvider(WebSocketStatusService, {
        isConnected$: of(true),
        isAuthenticated$,
      }),
    ],
  });

  beforeEach(() => {
    spectator = createService();
    wsHandler = spectator.inject(WebSocketHandlerService);
  });

  it('sends pings', fakeAsync(() => {
    spectator.service.setupPing();
    isAuthenticated$.next(true);

    tick(20 * 1000);
    expect(wsHandler.scheduleCall).toHaveBeenNthCalledWith(1, expect.objectContaining({ method: 'core.ping' }));
    expect(wsHandler.scheduleCall).toHaveBeenCalledTimes(1);
    tick(20 * 1000);
    expect(wsHandler.scheduleCall).toHaveBeenNthCalledWith(2, expect.objectContaining({ method: 'core.ping' }));
    expect(wsHandler.scheduleCall).toHaveBeenCalledTimes(2);
    tick(20 * 1000);
    expect(wsHandler.scheduleCall).toHaveBeenNthCalledWith(3, expect.objectContaining({ method: 'core.ping' }));
    expect(wsHandler.scheduleCall).toHaveBeenCalledTimes(3);

    isAuthenticated$.next(false);
    tick(20 * 1000);
    expect(wsHandler.scheduleCall).toHaveBeenCalledTimes(3);

    discardPeriodicTasks();
  }));
});
