import { InjectionToken } from '@angular/core';
import { webSocket as rxjsWebSocket } from 'rxjs/webSocket';
import { WebSocketError } from 'app/interfaces/websocket-error.interface';

// eslint-disable-next-line @typescript-eslint/naming-convention
export const WEBSOCKET = new InjectionToken<typeof rxjsWebSocket>(
  'WebSocket',
  {
    providedIn: 'root',
    factory: () => rxjsWebSocket,
  },
);

export function isWebSocketError(error: unknown): error is WebSocketError {
  if (error === null) return false;

  return typeof error === 'object'
    && 'error' in error
    && 'extra' in error
    && 'reason' in error
    && 'trace' in error;
}
