import { MockServiceError } from './mock-service-error';

export class MockConfigError extends MockServiceError {
  constructor(message: string, cause?: unknown) {
    super(message, cause);
    this.name = 'MockConfigError';
  }
}
