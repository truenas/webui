import { InjectionToken } from '@angular/core';
import { webSocket as rxjsWebSocket } from 'rxjs/webSocket';
import { ApiError } from 'app/interfaces/api-error.interface';

// eslint-disable-next-line @typescript-eslint/naming-convention
export const WEBSOCKET = new InjectionToken<typeof rxjsWebSocket>(
  'WebSocket',
  {
    providedIn: 'root',
    factory: () => rxjsWebSocket,
  },
);

export function isWebSocketError(error: unknown): error is ApiError {
  if (error === null) return false;

  return typeof error === 'object'
    && 'error' in error
    && 'extra' in error
    && 'reason' in error
    && 'trace' in error;
}
