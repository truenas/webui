import { MockServiceError } from './mock-service-error';

export class MockGenerationError extends MockServiceError {
  constructor(message: string, cause?: unknown) {
    super(message, cause);
    this.name = 'MockGenerationError';
  }
}
