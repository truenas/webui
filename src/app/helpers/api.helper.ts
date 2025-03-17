import { isObject } from 'lodash-es';
import { ApiErrorDetails } from 'app/interfaces/api-error.interface';
import {
  ErrorResponse,
  RequestMessage,
  IncomingMessage,
  CollectionUpdateMessage, SuccessfulResponse,
} from 'app/interfaces/api-message.interface';
import { Job } from 'app/interfaces/job.interface';
import { ApiCallError, FailedJobError } from 'app/services/errors/error.classes';

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
