import { Disk } from 'app/interfaces/storage.interface';

export interface DiskDataEvent {
  name: 'DiskData';
  sender: unknown;
  data: Disk[];
}
