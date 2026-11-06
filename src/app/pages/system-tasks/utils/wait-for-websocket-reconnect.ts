import { Observable, filter, map, take } from 'rxjs';
import { ConnectionService } from 'app/modules/websocket/connection.service';

/**
 * Emits once the system that was taken down answers again. A live socket alone doesn't prove that:
 * the job returns once the work is scheduled, while the old socket is still up. `prepareShutdown()`
 * raises a flag that stays up until a *new* socket opens, so callers must call it before subscribing.
 * There is deliberately no timeout: a reboot can take minutes, and giving up drops the user on a
 * sign-in page that can't reach middleware.
 */
export function waitForWebSocketReconnect(connection: ConnectionService): Observable<void> {
  return connection.isClosed$.pipe(
    filter((isClosed) => !isClosed && !connection.isSystemShuttingDown),
    take(1),
    map((): void => undefined),
  );
}
