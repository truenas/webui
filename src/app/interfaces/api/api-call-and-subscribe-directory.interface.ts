import { Group } from 'app/interfaces/group.interface';
import { Pool } from 'app/interfaces/pool.interface';
import { User } from 'app/interfaces/user.interface';

/**
 * Directory of compatible API call and subscribe methods.
 */
export interface ApiCallAndSubscribeEventDirectory {
  'user.query': { response: User };
  'pool.query': { response: Pool };
  'group.query': { response: Group };
}

export type ApiCallAndSubscribeMethod = keyof ApiCallAndSubscribeEventDirectory;
export type ApiCallAndSubscribeResponse<T extends ApiCallAndSubscribeMethod> = ApiCallAndSubscribeEventDirectory[T]['response'];
