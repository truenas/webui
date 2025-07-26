export class LocalStorageError extends Error {
  readonly operation: 'read' | 'write' | 'parse' | 'remove';
  readonly key: string;
  override readonly cause?: unknown;

  constructor(
    message: string,
    operation: 'read' | 'write' | 'parse' | 'remove',
    key: string,
    cause?: unknown,
  ) {
    super(message);
    this.name = 'LocalStorageError';
    this.operation = operation;
    this.key = key;
    this.cause = cause;
  }
}

export class MockConfigError extends Error {
  readonly configId?: string;
  override readonly cause?: unknown;

  constructor(
    message: string,
    configId?: string,
    cause?: unknown,
  ) {
    super(message);
    this.name = 'MockConfigError';
    this.configId = configId;
    this.cause = cause;
  }
}

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
