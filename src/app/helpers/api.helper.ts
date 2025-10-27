import { isObject } from 'lodash-es';
import { ApiErrorDetails } from 'app/interfaces/api-error.interface';
import {
  ErrorResponse,
  RequestMessage,
  IncomingMessage,
  CollectionUpdateMessage, SuccessfulResponse, NotifyUnsubscribedMessage,
} from 'app/interfaces/api-message.interface';
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

export function isCollectionUpdateMessage(something: unknown): something is CollectionUpdateMessage {
  return isIncomingMessage(something) && 'method' in something && something.method === 'collection_update';
}

export function isSuccessfulResponse(something: unknown): something is SuccessfulResponse {
  return isIncomingMessage(something)
    && 'result' in something;
}

export function isErrorResponse(something: unknown): something is ErrorResponse {
  return isIncomingMessage(something)
    && 'error' in something
    && Boolean(something.error);
}

export function isNotifyUnsubscribedMessage(something: unknown): something is NotifyUnsubscribedMessage {
  return isIncomingMessage(something)
    && 'method' in something
    && something.method === 'notify_unsubscribed';
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

export function makeRequestMessage(message: Pick<RequestMessage, 'id' | 'method' | 'params'>): RequestMessage {
  return {
    jsonrpc: '2.0',
    ...message,
  };
}

/**
 * transforms an `ApiCallError` into a new error by replacing an error message `msg` with
 * the string `replace`. the `ApiCallError` is expected to have the property `error.error.data.extra`
 * with type `Array<[string, string, number?]>`. `msg` should be in the 2nd string in the tuple.
 *
 * @param error - the `ApiCallError` to transform
 * @param msg - the message string to search for and replace
 * @param replace - the replacement message string
 * @returns a new `ApiCallError` with the transformed message *or* the original error if the message is not found
 *          or if the `extra` property is not an array.
 */
export function transformApiCallError(error: ApiCallError, msg: string, replace: string): ApiCallError {
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
