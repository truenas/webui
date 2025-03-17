import { ApiErrorName } from 'app/enums/api.enum';
import { JobState } from 'app/enums/job-state.enum';
import {
  extractApiErrorDetails,
  isApiCallError,
  isCollectionUpdateMessage,
  isErrorResponse,
  isFailedJob,
  isFailedJobError,
  isIncomingMessage,
  isSuccessfulResponse, makeRequestMessage,
} from 'app/helpers/api.helper';
import { ApiErrorDetails } from 'app/interfaces/api-error.interface';
import { IncomingMessage, JsonRpcError, RequestMessage } from 'app/interfaces/api-message.interface';
import { Job } from 'app/interfaces/job.interface';
import { ApiCallError, FailedJobError } from 'app/services/errors/error.classes';

describe('isApiCallError', () => {
  it('should return true for ApiCallError instances', () => {
    const error = new ApiCallError({ } as JsonRpcError);
    expect(isApiCallError(error)).toBe(true);

    const notError = new Error('test error');
    expect(isApiCallError(notError)).toBe(false);
  });
});

describe('isFailedJobError', () => {
  it('should return true for FailedJobError instances', () => {
    const error = new FailedJobError({ } as Job);
    expect(isFailedJobError(error)).toBe(true);

    const notError = new Error('test error');
    expect(isFailedJobError(notError)).toBe(false);
  });
});

describe('isFailedJob', () => {
  it('should return true for objects that looks like a Job that has failed', () => {
    const job = {
      state: JobState.Failed,
      error: 'test error',
      exception: 'test exception',
      exc_info: {},
    } as Job;

    expect(isFailedJob(job)).toBe(true);

    const notFailedJob = {
      state: JobState.Running,
      error: 'test error',
    } as Job;
    expect(isFailedJob(notFailedJob)).toBe(false);
  });
});

describe('isIncomingMessage', () => {
  it('should return true for objects that look like IncomingMessage', () => {
    const message = {
      jsonrpc: '2.0',
      result: 2,
    } as IncomingMessage;

    expect(isIncomingMessage(message)).toBe(true);

    const notMessage = {};
    expect(isIncomingMessage(notMessage)).toBe(false);
  });
});

describe('isCollectionUpdateMessage', () => {
  it('should return true for objects that look like CollectionUpdateMessage', () => {
    const message = {
      jsonrpc: '2.0',
      method: 'collection_update',
    } as IncomingMessage;

    expect(isCollectionUpdateMessage(message)).toBe(true);
  });
});

describe('isSuccessfulResponse', () => {
  it('should return true for objects that look like SuccessfulResponse', () => {
    const message = {
      jsonrpc: '2.0',
      result: 2,
    } as IncomingMessage;

    expect(isSuccessfulResponse(message)).toBe(true);

    const notMessage = {};
    expect(isSuccessfulResponse(notMessage)).toBe(false);
  });
});

describe('isErrorResponse', () => {
  it('should return true for objects that look like ErrorResponse', () => {
    const message = {
      jsonrpc: '2.0',
      error: {
        message: 'Error',
      } as JsonRpcError,
    } as IncomingMessage;

    expect(isErrorResponse(message)).toBe(true);

    const notMessage = {};
    expect(isErrorResponse(notMessage)).toBe(false);
  });
});

describe('extractApiErrorDetails', () => {
  it('should return ApiErrorDetails from ApiCallError', () => {
    const error = new ApiCallError({
      message: 'Error',
      data: {
        errname: ApiErrorName.NotAuthenticated,
      } as ApiErrorDetails,
    } as JsonRpcError);

    const result = extractApiErrorDetails(error);

    expect(result).toEqual({
      errname: ApiErrorName.NotAuthenticated,
    });
  });
});

describe('makeRequestMessage', () => {
  it('wraps message to be a JSON-RPC message', () => {
    const message = {
      id: '123',
    } as RequestMessage;

    const result = makeRequestMessage(message);

    expect(result).toEqual({
      jsonrpc: '2.0',
      id: '123',
    });
  });
});
