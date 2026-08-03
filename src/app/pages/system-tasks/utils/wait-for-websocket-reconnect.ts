import { Observable, filter, map, take } from 'rxjs';
import { WebSocketHandlerService } from 'app/modules/websocket/websocket-handler.service';
import { WebSocketStatusService } from 'app/services/websocket-status.service';

/**
 * Emits once the system that was taken down is answering again.
 *
 * A live connection on its own does not mean the system is back: the jobs return as soon as
 * the work is scheduled, so the socket is still the original one for as long as it takes the
 * box to tear down networking. `prepareShutdown()` marks that window - the flag stays up until
 * `WebSocketHandlerService` opens a *new* connection - so a connection that is live while the
 * flag is down is one that outlived the shutdown, whether we saw the drop or not. Callers must
 * therefore call `prepareShutdown()` before subscribing.
 *
 * Nothing here is bounded by a wall clock on purpose. A reboot legitimately takes minutes, and
 * timing out means dropping the user on a sign-in page that cannot reach middleware - a broken
 * session, against the cost of leaving the splash screen up for too long.
 */
export function waitForWebSocketReconnect(
  wsStatus: WebSocketStatusService,
  wsManager: WebSocketHandlerService,
): Observable<void> {
  return wsStatus.isConnected$.pipe(
    filter((isConnected) => isConnected && !wsManager.isSystemShuttingDown),
    take(1),
    map((): void => undefined),
  );
}
