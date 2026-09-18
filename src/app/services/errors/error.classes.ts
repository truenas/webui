// eslint-disable-next-line max-classes-per-file
import { ApiErrorDetails } from 'app/interfaces/api-error.interface';
import { JsonRpcError } from 'app/interfaces/api-message.interface';
import { Job } from 'app/interfaces/job.interface';

/**
 * We have to wrap error objects into classes because this allows us to capture JS stack trace.
 */
export class ApiCallError extends Error {
  constructor(
    public error: JsonRpcError,
  ) {
    let message = error.message;
    if (error.data?.reason && error.data?.reason !== error.message) {
      message = `${message} - ${error.data.reason}`;
    }

    super(message);

    this.name = 'ApiCallError';
  }
}

export class FailedJobError extends Error {
  apiErrorDetails?: ApiErrorDetails;

  constructor(
    public job: Job,
  ) {
    super(job.error || 'Unknown error');
    this.name = 'FailedJob';
  }
}

export class AbortedJobError extends Error {
  constructor(
    public job: Job,
  ) {
    super('Job aborted');
    this.name = 'AbortedJob';
  }
}

/**
 * The typed API session could not be established, so the requests waiting on
 * it are refused rather than held. `cause` is the last login failure.
 */
export class TypedApiSessionError extends Error {
  constructor(cause: unknown) {
    super('Typed API session could not be established', { cause });
    this.name = 'TypedApiSessionError';
  }
}
