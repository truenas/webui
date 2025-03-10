import { VdevType } from 'app/enums/v-dev-type.enum';
import { TopologyItem } from 'app/interfaces/storage.interface';

export interface VDevGroup {
  group: string;
  guid: VdevType;
  children: TopologyItem[];
  isRoot?: boolean;
  disk?: string;
}

export type DeviceNestedDataNode = TopologyItem | VDevGroup;

export function isVdevGroup(node: DeviceNestedDataNode): node is VDevGroup {
  return 'group' in node;
}
