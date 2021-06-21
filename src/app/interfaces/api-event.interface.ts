import { ApiEventMessage } from 'app/enums/api-event-message.enum';

export interface ApiEvent<T> {
  collection: string; // TODO: ApiMethod?
  fields: T;
  id: number;
  msg: ApiEventMessage;
}
