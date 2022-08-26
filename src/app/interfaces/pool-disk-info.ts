import { PoolStatus } from 'app/enums/pool-status.enum';
import { TopologyItemStatus } from 'app/enums/vdev-status.enum';

export interface PoolDiskInfo {
  name: string;
  read: number;
  write: number;
  checksum: number;
  status: TopologyItemStatus | PoolStatus;
  actions?: any;
  path?: string;
  guid: string;
}
