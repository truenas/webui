export class MockServiceError extends Error {
  override cause?: unknown;

  constructor(message: string, cause?: unknown) {
    super(message);
    this.name = 'MockServiceError';
    this.cause = cause;
  }
}
