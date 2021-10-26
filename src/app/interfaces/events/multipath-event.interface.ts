import { Multipath } from 'app/interfaces/multipath.interface';
import { QueryParams } from 'app/interfaces/query-api.interface';

export interface MultipathRequestEvent {
  name: 'MultipathRequest';
  sender: unknown;
  data: QueryParams<Multipath>;
}

export interface MultipathDataEvent {
  name: 'MultipathData';
  sender: unknown;
  data: Multipath[];
}
