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
  isSuccessfulResponse, makeRequestMessage, transformApiCallError,
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

describe('transformApiCallError', () => {
  it('should replace a message in the error extra data', () => {
    const error = new ApiCallError({
      message: 'Validation error',
      data: {
        extra: [
          ['attributes.path', 'Path must exist when "exists" is set', 22],
          ['attributes.size', 'Size must be positive', 22],
        ],
      } as ApiErrorDetails,
    } as JsonRpcError);

    const result = transformApiCallError(
      error,
      'Path must exist when "exists" is set',
      'The file path does not exist. Please select an existing file.',
    );

    expect(result.error.data.extra).toEqual([
      ['attributes.path', 'The file path does not exist. Please select an existing file.', 22],
      ['attributes.size', 'Size must be positive', 22],
    ]);
  });

  it('should use partial matching to replace messages', () => {
    const error = new ApiCallError({
      message: 'Validation error',
      data: {
        extra: [
          ['field1', 'This is a very long error message that contains specific text', 22],
        ],
      } as ApiErrorDetails,
    } as JsonRpcError);

    const result = transformApiCallError(
      error,
      'specific text',
      'Replaced message',
    );

    expect(result.error.data.extra).toEqual([
      ['field1', 'Replaced message', 22],
    ]);
  });

  it('should not modify messages that do not match', () => {
    const error = new ApiCallError({
      message: 'Validation error',
      data: {
        extra: [
          ['field1', 'Some error message', 22],
          ['field2', 'Another error message', 22],
        ],
      } as ApiErrorDetails,
    } as JsonRpcError);

    const result = transformApiCallError(
      error,
      'non-existent message',
      'Replacement',
    );

    expect(result.error.data.extra).toEqual([
      ['field1', 'Some error message', 22],
      ['field2', 'Another error message', 22],
    ]);
  });

  it('should handle errors without code parameter', () => {
    const error = new ApiCallError({
      message: 'Validation error',
      data: {
        extra: [
          ['field1', 'Error message to replace'],
        ],
      } as ApiErrorDetails,
    } as JsonRpcError);

    const result = transformApiCallError(
      error,
      'Error message to replace',
      'New error message',
    );

    expect(result.error.data.extra).toEqual([
      ['field1', 'New error message'],
    ]);
  });

  it('should handle empty extra array', () => {
    const error = new ApiCallError({
      message: 'Validation error',
      data: {
        extra: [],
      } as ApiErrorDetails,
    } as JsonRpcError);

    const result = transformApiCallError(
      error,
      'any message',
      'replacement',
    );

    expect(result.error.data.extra).toEqual([]);
  });

  it('should return an identical error if the data field does not exist', () => {
    const error = new ApiCallError({
      message: 'Validation error',
    } as JsonRpcError);

    const result = transformApiCallError(
      error,
      'any message',
      'replacement',
    );

    expect(result).toBe(error);
  });
});
