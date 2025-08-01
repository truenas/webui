import { WebSocketError } from './websocket-error';

export class WebSocketConnectionError extends WebSocketError {
  constructor(message: string, cause?: unknown) {
    super(message, cause);
    this.name = 'WebSocketConnectionError';
  }
}
