import { Option } from 'app/interfaces/option.interface';
import { UnusedDisk } from 'app/interfaces/storage.interface';

export interface ManagerDisk extends UnusedDisk {
  real_capacity: number;
  capacity: string;
  details: Option[];
}
