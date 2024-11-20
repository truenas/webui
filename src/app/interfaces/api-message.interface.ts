import { IncomingApiMessageType } from 'app/enums/api-message-type.enum';
import { ApiCallMethod } from 'app/interfaces/api/api-call-directory.interface';
import { ApiEventDirectory } from 'app/interfaces/api/api-event-directory.interface';
import { ApiJobMethod } from 'app/interfaces/api/api-job-directory.interface';
import { ApiError } from 'app/interfaces/api-error.interface';

export interface PongMessage {
  id: string;
  msg: IncomingApiMessageType.Pong;
}

export interface SubscriptionReadyMessage {
  msg: IncomingApiMessageType.Ready;
  subs: string[];
}

export interface ResultMessage<T = unknown> {
  id: string;
  msg: IncomingApiMessageType.Result;
  result?: T;
  error?: ApiError;
}

export interface ConnectedMessage {
  msg: IncomingApiMessageType.Connected;
  session: string;
}

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

export type IncomingApiMessage =
  | PongMessage
  | SubscriptionReadyMessage
  | ResultMessage
  | ConnectedMessage
  | ApiEvent;
