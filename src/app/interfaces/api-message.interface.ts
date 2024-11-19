import { IncomingApiMessageType } from 'app/enums/api-message-type.enum';
import { JsonRpcErrorCode } from 'app/enums/api.enum';
import { ApiCallMethod } from 'app/interfaces/api/api-call-directory.interface';
import { ApiEventDirectory } from 'app/interfaces/api/api-event-directory.interface';
import { ApiJobMethod } from 'app/interfaces/api/api-job-directory.interface';
import { ApiError } from 'app/interfaces/api-error.interface';

interface JsonRpcMessage {
  jsonrpc: '2.0';
}

export interface RequestMessage extends JsonRpcMessage {
  id?: string;
  method: ApiMethod;
  params?: unknown[];
}

export interface SuccessfulResponse extends JsonRpcMessage {
  id: string;
  result: unknown;
}

export interface ErrorResponse extends JsonRpcMessage {
  jsonrpc: '2.0';
  id: string;
  error: JsonRpcError;
}

export interface CollectionUpdateMessage extends JsonRpcMessage {
  method: 'collection_update';
  params: ApiEvent;
}

export interface JsonRpcError {
  code: JsonRpcErrorCode;
  message: string;
  data?: ApiError;
}

export type ResponseMessage =
  | SuccessfulResponse
  | ErrorResponse;

export type ApiMethod = ApiCallMethod | ApiJobMethod | ApiEventMethod;

export interface ApiEvent<T = unknown> {
  collection: ApiCallMethod | ApiJobMethod | ApiEventMethod;
  fields: T;
  id: number | string;
  msg: IncomingApiMessageType.Changed
    | IncomingApiMessageType.Added
    | IncomingApiMessageType.Removed
    | IncomingApiMessageType.NoSub;
}

export type ApiEventMethod = keyof ApiEventDirectory;
export type ApiEventResponseType<K extends ApiEventMethod = ApiEventMethod> = ApiEventDirectory[K]['response'];

export type ApiEventTyped<
  M extends ApiEventMethod = ApiEventMethod,
  T extends ApiEventResponseType<M> = ApiEventResponseType<M>,
> = ApiEvent<T>;
