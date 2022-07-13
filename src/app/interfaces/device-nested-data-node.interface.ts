import { VDevStatus } from 'app/enums/vdev-status.enum';
import { NestedDataNode } from 'app/interfaces/nested-data-node.interface';
import { VDevStats } from 'app/interfaces/storage.interface';

export interface DeviceNestedDataNode extends NestedDataNode {
  guid: string;
  disk: string;
  name: string;
  type: string;
  path: string;
  status: VDevStatus;
  stats: VDevStats;
  device: string;
}
