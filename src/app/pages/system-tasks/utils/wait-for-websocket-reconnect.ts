import { Observable, filter, switchMap, take } from 'rxjs';
import { WebSocketStatusService } from 'app/services/websocket-status.service';

/**
 * Emits once the websocket has gone down and come back up again.
 *
 * `prepareShutdown()` only raises a flag - the socket is still connected when a restart or
 * config reset job returns, so we have to wait for the connection to actually drop before a
 * live connection can be read as "the system finished rebooting".
 */
export function waitForWebSocketReconnect(wsStatus: WebSocketStatusService): Observable<boolean> {
  return wsStatus.isConnected$.pipe(
    filter((isConnected) => !isConnected),
    take(1),
    switchMap(() => wsStatus.isConnected$.pipe(
      filter((isConnected) => isConnected),
      take(1),
    )),
  );
}
