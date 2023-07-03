import { IncomingApiMessageType } from 'app/enums/api-message-type.enum';
import { WebsocketError } from 'app/interfaces/websocket-error.interface';

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
  error?: WebsocketError;
}

export interface ConnectedMessage {
  msg: IncomingApiMessageType.Connected;
  session: string;
}

export interface ApiEvent<T = unknown> {
  collection: string; // TODO: ApiMethod?
  fields: T;
  id: number | string;
  msg: IncomingApiMessageType.Changed
  | IncomingApiMessageType.Added
  | IncomingApiMessageType.Removed
  | IncomingApiMessageType.NoSub;
}

export type IncomingWebsocketMessage =
  | PongMessage
  | SubscriptionReadyMessage
  | ResultMessage
  | ConnectedMessage
  | ApiEvent;
