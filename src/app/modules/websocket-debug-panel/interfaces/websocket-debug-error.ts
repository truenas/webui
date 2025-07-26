export class WebSocketDebugError extends Error {
  readonly code: string;
  override readonly cause?: unknown;

  constructor(
    message: string,
    code: string,
    cause?: unknown,
  ) {
    super(message);
    this.name = 'WebSocketDebugError';
    this.code = code;
    this.cause = cause;
  }
}
