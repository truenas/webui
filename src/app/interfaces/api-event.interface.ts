import { ApiEventMessage } from 'app/enums/api-event-message.enum';

export interface ApiEvent<T> {
  collection: string; // TODO: ApiMethod?
  fields: T;
  id: number;
  msg: ApiEventMessage;
  // true when item is fully removed from the collection
  // TODO: Find usages and guard against directly in WebsocketService. Only rely on 'removed' ApiEventMessage
  /**
   * @deprecated
   */
  cleared?: boolean;
}
