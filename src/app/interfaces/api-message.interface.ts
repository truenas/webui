import { CollectionChangeType, JsonRpcErrorCode } from 'app/enums/api.enum';
import { ApiErrorDetails } from 'app/interfaces/api-error.interface';

/**
 * General documentation about message format: https://www.jsonrpc.org/specification
 */
interface BaseJsonRpc {
  jsonrpc: '2.0';
}

export interface RequestMessage extends BaseJsonRpc {
  id?: string;
  /**
   * Not narrowed to the API directory: these frames describe whatever crosses the socket,
   * including what the debug panel mocks.
   */
  method: string;
  params?: unknown[];
}

export interface SuccessfulResponse extends BaseJsonRpc {
  id: string;
  result: unknown;
}

export interface ErrorResponse extends BaseJsonRpc {
  id: string;
  error: JsonRpcError;
}

export interface CollectionUpdateMessage extends BaseJsonRpc {
  method: 'collection_update';
  params: ApiEvent;
}

export interface NotifyUnsubscribedMessage extends BaseJsonRpc {
  method: 'notify_unsubscribed';
  params: {
    collection: string;
    error?: ApiErrorDetails;
  };
}

export interface JsonRpcError {
  code: JsonRpcErrorCode;
  message: string;
  data?: ApiErrorDetails;
}

export type IncomingMessage
  = | SuccessfulResponse
    | ErrorResponse
    | CollectionUpdateMessage
    | NotifyUnsubscribedMessage;

export interface ApiEvent<T = unknown> {
  collection: string;
  fields: T;
  id: number | string;
  msg: CollectionChangeType.Changed
    | CollectionChangeType.Added
    | CollectionChangeType.Removed;
}
