import { Pool } from 'app/interfaces/pool.interface';

/**
 * Directory of compatible API call and subscribe methods.
 */
export interface ApiCallAndSubscribeEventDirectory {
  'pool.query': { response: Pool };
}

export type ApiCallAndSubscribeMethod = keyof ApiCallAndSubscribeEventDirectory;
export type ApiCallAndSubscribeResponse<T extends ApiCallAndSubscribeMethod> = ApiCallAndSubscribeEventDirectory[T]['response'];
