import { CollectionChangeType, JsonRpcErrorCode } from 'app/enums/api.enum';
import { ApiCallMethod } from 'app/interfaces/api/api-call-directory.interface';
import { ApiEventDirectory } from 'app/interfaces/api/api-event-directory.interface';
import { ApiJobMethod } from 'app/interfaces/api/api-job-directory.interface';
import { ApiError } from 'app/interfaces/api-error.interface';

/**
 * General documentation about message format: https://www.jsonrpc.org/specification
 */
interface BaseJsonRpc {
  jsonrpc: '2.0';
}

export interface RequestMessage extends BaseJsonRpc {
  id?: string;
  method: ApiMethod;
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

export interface JsonRpcError {
  code: JsonRpcErrorCode;
  message: string;
  data?: ApiError;
}

export type IncomingMessage =
  | SuccessfulResponse
  | ErrorResponse
  | CollectionUpdateMessage;

export type ApiMethod = ApiCallMethod | ApiJobMethod | ApiEventMethod;

export interface ApiEvent<T = unknown> {
  collection: ApiCallMethod | ApiJobMethod | ApiEventMethod;
  fields: T;
  id: number | string;
  msg: CollectionChangeType.Changed
    | CollectionChangeType.Added
    | CollectionChangeType.Removed;
  // TODO: | IncomingApiMessageType.NoSub
}

export type ApiEventMethod = keyof ApiEventDirectory;
export type ApiEventResponseType<K extends ApiEventMethod = ApiEventMethod> = ApiEventDirectory[K]['response'];

export type ApiEventTyped<
  M extends ApiEventMethod = ApiEventMethod,
  T extends ApiEventResponseType<M> = ApiEventResponseType<M>,
> = ApiEvent<T>;
