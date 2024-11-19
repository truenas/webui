import { ApiError } from 'app/interfaces/api-error.interface';
import { ErrorResponse, RequestMessage, ResponseMessage } from 'app/interfaces/api-message.interface';

export function isApiError(error: unknown): error is ApiError {
  if (error === null) return false;

  return typeof error === 'object'
    && 'error' in error
    && 'extra' in error
    && 'reason' in error
    && 'trace' in error;
}

export function isErrorResponse(response: ResponseMessage): response is ErrorResponse {
  return 'error' in response && Boolean(response.error);
}

export function makeRequestMessage(message: Pick<RequestMessage, 'id' | 'method' | 'params'>): RequestMessage {
  return {
    jsonrpc: '2.0',
    ...message,
    // TODO: Workaround for: https://ixsystems.atlassian.net/browse/NAS-132605
    params: message.params || [],
  };
}
