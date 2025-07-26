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
