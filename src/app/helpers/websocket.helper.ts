import { InjectionToken } from '@angular/core';
import { webSocket as rxjsWebSocket } from 'rxjs/webSocket';

// eslint-disable-next-line @typescript-eslint/naming-convention
export const WEBSOCKET = new InjectionToken<typeof rxjsWebSocket>(
  'WebSocket',
  {
    providedIn: 'root',
    factory: () => rxjsWebSocket,
  },
);
