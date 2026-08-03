import {
  Observable, filter, map, race, switchMap, take, timer,
} from 'rxjs';
import { WebSocketStatusService } from 'app/services/websocket-status.service';

/**
 * How long to keep waiting for the socket to go down before assuming it already has.
 * Middleware stops answering within a few seconds of a reboot or config reset job returning.
 */
export const waitForDisconnectTimeout = 15 * 1000;

/**
 * Emits once the websocket has gone down and come back up again.
 *
 * `prepareShutdown()` only raises a flag - the socket is still connected when a restart or
 * config reset job returns, so we have to wait for the connection to actually drop before a
 * live connection can be read as "the system finished rebooting".
 *
 * The drop is only awaited for up to `disconnectTimeout`, because it may never be observed:
 * the socket can go down and be reconnected by `WebSocketHandlerService` before we even
 * subscribe, and the middleware may not go down at all despite the job reporting success.
 * The timeout also fires in the case where the socket simply has not gone down *yet* - the
 * jobs return as soon as the work is scheduled, so a slow teardown redirects the caller while
 * the connection is still the original one, exactly like the fixed 15s wait this replaced.
 * In every case the caller is released instead of waiting forever on the splash screen.
 * Coming back up is deliberately not bounded - a reboot legitimately takes minutes.
 */
export function waitForWebSocketReconnect(
  wsStatus: WebSocketStatusService,
  disconnectTimeout = waitForDisconnectTimeout,
): Observable<void> {
  const hasDisconnected$ = wsStatus.isConnected$.pipe(
    filter((isConnected) => !isConnected),
    take(1),
  );

  return race(hasDisconnected$, timer(disconnectTimeout)).pipe(
    switchMap(() => wsStatus.isConnected$.pipe(
      filter((isConnected) => isConnected),
      take(1),
    )),
    map((): void => undefined),
  );
}
