import { BehaviorSubject } from 'rxjs';
import { WebSocketHandlerService } from 'app/modules/websocket/websocket-handler.service';
import { waitForWebSocketReconnect } from 'app/pages/system-tasks/utils/wait-for-websocket-reconnect';
import { WebSocketStatusService } from 'app/services/websocket-status.service';

describe('waitForWebSocketReconnect', () => {
  let isConnected$: BehaviorSubject<boolean>;
  let isSystemShuttingDown: boolean;
  let emissions: number;

  function subscribeToReconnect(): void {
    const wsStatus = { isConnected$ } as WebSocketStatusService;
    const wsManager = {
      get isSystemShuttingDown(): boolean {
        return isSystemShuttingDown;
      },
    } as WebSocketHandlerService;

    waitForWebSocketReconnect(wsStatus, wsManager).subscribe(() => emissions += 1);
  }

  /** What `WebSocketHandlerService` does when a new connection opens. */
  function reconnect(): void {
    isSystemShuttingDown = false;
    isConnected$.next(true);
  }

  beforeEach(() => {
    emissions = 0;
    isSystemShuttingDown = true;
  });

  it('does not treat the connection the task started on as "the system is back"', () => {
    isConnected$ = new BehaviorSubject(true);

    subscribeToReconnect();

    expect(emissions).toBe(0);
  });

  it('emits once the system comes back up', () => {
    isConnected$ = new BehaviorSubject(true);

    subscribeToReconnect();
    isConnected$.next(false);

    expect(emissions).toBe(0);

    reconnect();

    expect(emissions).toBe(1);
  });

  it('keeps waiting while the connection is retried during the shutdown', () => {
    isConnected$ = new BehaviorSubject(true);

    subscribeToReconnect();
    isConnected$.next(false);
    // A retry that lands before the system is really down: the flag is still up.
    isConnected$.next(true);

    expect(emissions).toBe(0);
  });

  it('emits immediately when the system came back before the caller subscribed', () => {
    isConnected$ = new BehaviorSubject(false);
    reconnect();

    subscribeToReconnect();

    expect(emissions).toBe(1);
  });

  it('does not emit again when the connection flaps after the system is back', () => {
    isConnected$ = new BehaviorSubject(false);

    subscribeToReconnect();
    reconnect();
    isConnected$.next(false);
    isConnected$.next(true);

    expect(emissions).toBe(1);
  });
});
