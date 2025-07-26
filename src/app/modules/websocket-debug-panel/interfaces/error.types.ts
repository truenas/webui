export class LocalStorageError extends Error {
  constructor(
    message: string,
    public readonly operation: 'read' | 'write' | 'parse',
    public readonly key: string,
    public override readonly cause?: unknown,
  ) {
    super(message);
    this.name = 'LocalStorageError';
  }
}

export class MockConfigError extends Error {
  constructor(
    message: string,
    public readonly configId?: string,
    public override readonly cause?: unknown,
  ) {
    super(message);
    this.name = 'MockConfigError';
  }
}

export class WebSocketDebugError extends Error {
  constructor(
    message: string,
    public readonly code: string,
    public override readonly cause?: unknown,
  ) {
    super(message);
    this.name = 'WebSocketDebugError';
  }
}