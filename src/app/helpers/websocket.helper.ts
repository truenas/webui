import { InjectionToken } from '@angular/core';
import { webSocket as rxjsWebsocket } from 'rxjs/webSocket';

// eslint-disable-next-line @typescript-eslint/naming-convention
export const WEBSOCKET = new InjectionToken<typeof rxjsWebsocket>(
  'WebSocket',
  {
    providedIn: 'root',
    factory: () => rxjsWebsocket,
  },
);
