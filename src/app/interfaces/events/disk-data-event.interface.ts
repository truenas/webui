import { QueryParams } from 'app/interfaces/query-api.interface';
import { Disk } from 'app/interfaces/storage.interface';

export interface DisksRequestEvent {
  name: 'DiskDataEvent';
  sender: unknown;
  data: QueryParams<Disk>;
}

export interface DiskDataEvent {
  name: 'DiskData';
  sender: unknown;
  data: Disk[];
}
