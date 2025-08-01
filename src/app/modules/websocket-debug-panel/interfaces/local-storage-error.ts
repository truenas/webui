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
