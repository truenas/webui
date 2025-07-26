import { WebSocketError } from './websocket-error';

export class WebSocketSendError extends WebSocketError {
  constructor(message: string, cause?: unknown) {
    super(message, cause);
    this.name = 'WebSocketSendError';
  }
}
