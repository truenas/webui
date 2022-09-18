import { PoolStatus } from 'app/enums/pool-status.enum';
import { TopologyItemStatus } from 'app/enums/vdev-status.enum';
import {
  EntityTreeTableActionGroup,
} from 'app/modules/entity/entity-tree-table/entity-tree-table.model';

export interface PoolDiskInfo {
  name: string;
  read: number;
  write: number;
  checksum: number;
  status: TopologyItemStatus | PoolStatus;
  actions?: EntityTreeTableActionGroup[];
  path?: string;
  guid: string;
}
