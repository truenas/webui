import { WebSocketDebugMessage } from 'app/modules/websocket-debug-panel/interfaces/websocket-debug.interface';
import { WebSocketDebugState } from 'app/modules/websocket-debug-panel/store/websocket-debug.reducer';

export function addMessageWithLimit(
  state: WebSocketDebugState,
  message: WebSocketDebugMessage,
): WebSocketDebugState {
  const messages = [...state.messages, message];

  if (messages.length > state.messageLimit) {
    messages.splice(0, messages.length - state.messageLimit);
  }

  return { ...state, messages };
}
