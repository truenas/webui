import { discardPeriodicTasks, fakeAsync, tick } from '@angular/core/testing';
import { createServiceFactory, mockProvider, SpectatorService } from '@ngneat/spectator/jest';
import { BehaviorSubject } from 'rxjs';
import { PingService } from 'app/modules/websocket/ping.service';
import { WebSocketHandlerService } from 'app/modules/websocket/websocket-handler.service';
import { WebSocketStatusService } from 'app/services/websocket-status.service';

describe('PingService', () => {
  let spectator: SpectatorService<PingService>;
  let wsHandler: WebSocketHandlerService;
  const isConnected$ = new BehaviorSubject(false);

  const createService = createServiceFactory({
    service: PingService,
    providers: [
      mockProvider(WebSocketHandlerService, {
        scheduleCall: jest.fn(),
      }),
      mockProvider(WebSocketStatusService, {
        isConnected$,
        get isConnected() { return isConnected$.value; },
      }),
    ],
  });

  beforeEach(() => {
    isConnected$.next(false); // Reset connection state
    spectator = createService();
    wsHandler = spectator.inject(WebSocketHandlerService);
    jest.clearAllMocks();
  });

  it('automatically sets up ping when connection is established', fakeAsync(() => {
    // Service auto-initializes on instantiation, so no need to call initializePingService()

    // Simulate WebSocket connection
    isConnected$.next(true);
    tick(1); // Allow subscription to process

    tick(20 * 1000);
    expect(wsHandler.scheduleCall).toHaveBeenNthCalledWith(1, expect.objectContaining({ method: 'core.ping' }));
    expect(wsHandler.scheduleCall).toHaveBeenCalledTimes(1);

    tick(20 * 1000);
    expect(wsHandler.scheduleCall).toHaveBeenNthCalledWith(2, expect.objectContaining({ method: 'core.ping' }));
    expect(wsHandler.scheduleCall).toHaveBeenCalledTimes(2);

    // Simulate connection loss
    isConnected$.next(false);
    tick(20 * 1000);
    expect(wsHandler.scheduleCall).toHaveBeenCalledTimes(2);

    discardPeriodicTasks();
  }));

  it('prevents duplicate initialization', fakeAsync(() => {
    // Service auto-initializes on instantiation, test calling again
    spectator.service.initializePingService(); // Call manually after auto-init

    isConnected$.next(true);
    tick(20 * 1000);

    // Should only set up one ping subscription
    expect(wsHandler.scheduleCall).toHaveBeenCalledTimes(1);

    discardPeriodicTasks();
  }));

  it('cleans up previous subscription on reconnection', fakeAsync(() => {
    // Service auto-initializes on instantiation

    // First connection
    isConnected$.next(true);
    tick(1); // Allow subscription to process
    tick(20 * 1000);
    expect(wsHandler.scheduleCall).toHaveBeenCalledTimes(1);

    // Disconnect and reconnect
    isConnected$.next(false);
    tick(1); // Allow subscription to process
    isConnected$.next(true);
    tick(1); // Allow subscription to process

    tick(20 * 1000);
    // Should continue pinging without duplicates
    expect(wsHandler.scheduleCall).toHaveBeenCalledTimes(2);

    discardPeriodicTasks();
  }));

  it('handles initial connection state when service is instantiated after connection', fakeAsync(() => {
    // Set connection to true before service instantiation to simulate race condition
    isConnected$.next(true);

    // Create a new service instance to test race condition handling
    const newSpectator = createService();

    // Service should detect existing connection state and start ping
    tick(20 * 1000);
    expect(newSpectator.inject(WebSocketHandlerService).scheduleCall).toHaveBeenCalledWith(expect.objectContaining({ method: 'core.ping' }));

    discardPeriodicTasks();
  }));

  it('works without authentication (signin page compatibility)', fakeAsync(() => {
    // Service auto-initializes on instantiation

    // Only connection required, no authentication
    isConnected$.next(true);
    tick(1); // Allow subscription to process
    tick(20 * 1000);

    expect(wsHandler.scheduleCall).toHaveBeenCalledWith(expect.objectContaining({ method: 'core.ping' }));

    discardPeriodicTasks();
  }));
});
