import { discardPeriodicTasks, fakeAsync, tick } from '@angular/core/testing';
import { createServiceFactory, mockProvider, SpectatorService } from '@ngneat/spectator/jest';
import { BehaviorSubject } from 'rxjs';
import { mockCall, mockWebSocket } from 'app/core/testing/utils/mock-websocket.utils';
import { AuthService } from 'app/services/auth/auth.service';
import { PingService } from 'app/services/ping.service';
import { WebSocketService } from 'app/services/ws.service';

describe('PingService', () => {
  let spectator: SpectatorService<PingService>;
  let websocket: WebSocketService;
  const isAuthenticated$ = new BehaviorSubject(false);

  const createService = createServiceFactory({
    service: PingService,
    providers: [
      mockWebSocket([
        mockCall('core.ping', 'pong'),
      ]),
      mockProvider(AuthService, {
        isAuthenticated$,
      }),
    ],
  });

  beforeEach(() => {
    spectator = createService();
    websocket = spectator.inject(WebSocketService);
  });

  it('sends pings', fakeAsync(() => {
    spectator.service.setupPing();
    isAuthenticated$.next(true);

    tick(20 * 1000);
    expect(websocket.call).toHaveBeenNthCalledWith(1, 'core.ping');
    expect(websocket.call).toHaveBeenCalledTimes(1);
    tick(20 * 1000);
    expect(websocket.call).toHaveBeenNthCalledWith(2, 'core.ping');
    expect(websocket.call).toHaveBeenCalledTimes(2);
    tick(20 * 1000);
    expect(websocket.call).toHaveBeenNthCalledWith(3, 'core.ping');
    expect(websocket.call).toHaveBeenCalledTimes(3);

    isAuthenticated$.next(false);
    tick(20 * 1000);
    expect(websocket.call).toHaveBeenCalledTimes(3);

    discardPeriodicTasks();
  }));
});
