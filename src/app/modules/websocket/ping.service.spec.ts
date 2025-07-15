import { discardPeriodicTasks, fakeAsync, tick } from '@angular/core/testing';
import { createServiceFactory, mockProvider, SpectatorService } from '@ngneat/spectator/jest';
import { BehaviorSubject, of } from 'rxjs';
import { PingService } from 'app/modules/websocket/ping.service';
import { WebSocketHandlerService } from 'app/modules/websocket/websocket-handler.service';
import { WebSocketStatusService } from 'app/services/websocket-status.service';

describe('PingService', () => {
  let spectator: SpectatorService<PingService>;
  let wsHandler: WebSocketHandlerService;
  let wsStatus: WebSocketStatusService;
  const isConnected$ = new BehaviorSubject(false);

  const createService = createServiceFactory({
    service: PingService,
    providers: [
      mockProvider(WebSocketHandlerService, {
        scheduleCall: jest.fn(),
      }),
      mockProvider(WebSocketStatusService, {
        isConnected$,
        isConnected: false,
      }),
    ],
  });

  beforeEach(() => {
    spectator = createService();
    wsHandler = spectator.inject(WebSocketHandlerService);
    wsStatus = spectator.inject(WebSocketStatusService);
    jest.clearAllMocks();
  });

  it('automatically sets up ping when connection is established', fakeAsync(() => {
    spectator.service.initializePingService();
    
    // Simulate WebSocket connection
    isConnected$.next(true);
    
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
    spectator.service.initializePingService();
    spectator.service.initializePingService(); // Call twice
    
    isConnected$.next(true);
    tick(20 * 1000);
    
    // Should only set up one ping subscription
    expect(wsHandler.scheduleCall).toHaveBeenCalledTimes(1);
    
    discardPeriodicTasks();
  }));

  it('cleans up previous subscription on reconnection', fakeAsync(() => {
    spectator.service.initializePingService();
    
    // First connection
    isConnected$.next(true);
    tick(20 * 1000);
    expect(wsHandler.scheduleCall).toHaveBeenCalledTimes(1);
    
    // Disconnect and reconnect
    isConnected$.next(false);
    isConnected$.next(true);
    
    tick(20 * 1000);
    // Should continue pinging without duplicates
    expect(wsHandler.scheduleCall).toHaveBeenCalledTimes(2);
    
    discardPeriodicTasks();
  }));

  it('does not setup ping before initialization', fakeAsync(() => {
    // Don't call initializePingService()
    isConnected$.next(true);
    tick(20 * 1000);
    
    expect(wsHandler.scheduleCall).not.toHaveBeenCalled();
    
    discardPeriodicTasks();
  }));

  it('works without authentication (signin page compatibility)', fakeAsync(() => {
    spectator.service.initializePingService();
    
    // Only connection required, no authentication
    isConnected$.next(true);
    tick(20 * 1000);
    
    expect(wsHandler.scheduleCall).toHaveBeenCalledWith(expect.objectContaining({ method: 'core.ping' }));
    
    discardPeriodicTasks();
  }));
});
