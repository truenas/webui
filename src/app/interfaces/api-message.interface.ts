import { SubscribableEvent } from '@truenas/api-client';
import { CollectionChangeType, JsonRpcErrorCode } from 'app/enums/api.enum';
import { ApiErrorDetails } from 'app/interfaces/api-error.interface';
import { WebUiApiDirectory } from 'app/modules/websocket/typed-api/typed-api-client.token';

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
  // TODO: | IncomingApiMessageType.NoSub
}

export type ApiEventMethod = SubscribableEvent<WebUiApiDirectory>;

/**
 * An event from collection `M`, as the legacy `ApiService` hands it on. Its fields are left to the
 * caller to type: `TypedApiService.subscribe` types them per kind of change, with the client's `EventUnion`.
 */
// eslint-disable-next-line unused-imports/no-unused-vars -- `M` names the collection at call sites.
export type ApiEventTyped<M extends ApiEventMethod = ApiEventMethod, T = unknown> = ApiEvent<T>;
