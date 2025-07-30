import { EnvironmentProviders } from '@angular/core';
import { provideEffects } from '@ngrx/effects';
import { provideState } from '@ngrx/store';
import { WebSocketDebugEffects } from 'app/modules/websocket-debug-panel/store/websocket-debug.effects';
import { webSocketDebugReducer } from 'app/modules/websocket-debug-panel/store/websocket-debug.reducer';

/**
 * Providers for WebSocket Debug Panel feature state.
 * This can be added to the app providers when debug mode is enabled.
 */
export const provideWebSocketDebugState = (): EnvironmentProviders[] => {
  return [
    provideState('webSocketDebug', webSocketDebugReducer),
    provideEffects([WebSocketDebugEffects]),
  ];
};
