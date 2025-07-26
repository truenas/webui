export class WebSocketError extends Error {
  override cause?: unknown;

  constructor(message: string, cause?: unknown) {
    super(message);
    this.name = 'WebSocketError';
    this.cause = cause;
  }
}
