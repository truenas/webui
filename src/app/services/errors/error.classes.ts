// eslint-disable-next-line max-classes-per-file
import { JsonRpcError } from 'app/interfaces/api-message.interface';
import { Job } from 'app/interfaces/job.interface';

/**
 * We have to wrap error objects into classes because this allows us to capture JS stack trace.
 */
export class ApiCallError extends Error {
  constructor(
    public error: JsonRpcError,
  ) {
    super(error.message);
    this.name = 'ApiCallError';
  }
}

export class FailedJobError extends Error {
  constructor(
    public job: Job,
  ) {
    super(job.error);
    this.name = 'FailedJob';
  }
}
