import { isObject } from 'lodash-es';
import { ApiErrorDetails } from 'app/interfaces/api-error.interface';
import { ErrorResponse, IncomingMessage } from 'app/interfaces/api-message.interface';
import { Job } from 'app/interfaces/job.interface';
import { AbortedJobError, ApiCallError, FailedJobError } from 'app/services/errors/error.classes';

export function isApiCallError(something: unknown): something is ApiCallError {
  return something instanceof ApiCallError;
}

export function isApiErrorDetails(error: unknown): error is ApiErrorDetails {
  if (error === null) return false;

  return typeof error === 'object'
    && 'error' in error
    && 'extra' in error
    && 'reason' in error
    && 'trace' in error;
}

export function isFailedJobError(obj: unknown): obj is FailedJobError {
  return obj instanceof FailedJobError;
}

export function isAbortedJobError(obj: unknown): obj is AbortedJobError {
  return obj instanceof AbortedJobError;
}

export function isFailedJob(obj: unknown): obj is Job {
  if (obj === null) return false;

  return typeof obj === 'object'
    && ('state' in obj
      && 'error' in obj
      && 'exception' in obj
      && 'exc_info' in obj);
}

export function isIncomingMessage(something: unknown): something is IncomingMessage {
  return isObject(something) && 'jsonrpc' in something;
}

export function isErrorResponse(something: unknown): something is ErrorResponse {
  return isIncomingMessage(something)
    && 'error' in something
    && Boolean(something.error);
}

/**
 * Extract api error if it's available. Otherwise returns undefined.
 */
export function extractApiErrorDetails(someError: unknown): ApiErrorDetails | undefined {
  if (isApiCallError(someError)) {
    return someError.error.data;
  }

  return undefined;
}

/**
 * Returns a copy of `error` with `msg` replaced by `replace` in its `extra` tuples
 * (`[field, message, errno?]`), or the original error when `extra` isn't an array or lacks `msg`.
 */
export function transformApiCallErrorMessage(error: ApiCallError, msg: string, replace: string): ApiCallError {
  if (!error.error.data || !Array.isArray(error.error.data.extra)) {
    return error;
  }

  const extra = error.error.data.extra as [string, string, number?][];

  // we have an array of tuples, so we map over it and replace any tuple that contains the message
  // with an identical tuple with the message changed.
  const transformedExtra = extra.map(([field, message, code]) => {
    if (message.includes(msg)) {
      return [field, replace, code] as [string, string, number?];
    }
    return [field, message, code] as [string, string, number?];
  });

  return new ApiCallError({
    ...error.error,
    data: {
      ...error.error.data,
      extra: transformedExtra,
    },
  });
}
