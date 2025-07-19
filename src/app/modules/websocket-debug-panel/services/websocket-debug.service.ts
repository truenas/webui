import { Injectable } from '@angular/core';
import { Store } from '@ngrx/store';
import { UUID } from 'angular2-uuid';
import { IncomingMessage, RequestMessage } from 'app/interfaces/api-message.interface';
import { WebSocketDebugMessage } from 'app/modules/websocket-debug-panel/interfaces/websocket-debug.interface';
import * as WebSocketDebugActions from 'app/modules/websocket-debug-panel/store/websocket-debug.actions';

@Injectable({
  providedIn: 'root',
})
export class WebSocketDebugService {
  constructor(
    private store$: Store,
  ) {}

  logOutgoingMessage(message: RequestMessage, isMocked = false): void {
    const debugMessage: WebSocketDebugMessage = {
      id: UUID.UUID(),
      timestamp: new Date().toISOString(),
      direction: 'out',
      message,
      isMocked,
    };
    this.store$.dispatch(WebSocketDebugActions.messageSent({ message: debugMessage }));
  }

  logIncomingMessage(message: IncomingMessage, isMocked = false): void {
    const debugMessage: WebSocketDebugMessage = {
      id: UUID.UUID(),
      timestamp: new Date().toISOString(),
      direction: 'in',
      message,
      isMocked,
    };
    this.store$.dispatch(WebSocketDebugActions.messageReceived({ message: debugMessage }));
  }

  clearMessages(): void {
    this.store$.dispatch(WebSocketDebugActions.clearMessages());
  }

  setMessageLimit(limit: number): void {
    this.store$.dispatch(WebSocketDebugActions.setMessageLimit({ limit }));
  }
}
