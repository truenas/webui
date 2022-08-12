import { PoolTopologyCategory } from 'app/enums/pool-topology-category.enum';
import { TopologyItem } from 'app/interfaces/storage.interface';

export interface VDevGroup {
  group: string;
  guid: PoolTopologyCategory;
  children: TopologyItem[];
}

export type DeviceNestedDataNode = TopologyItem | VDevGroup;

export function isVdevGroup(node: DeviceNestedDataNode): node is VDevGroup {
  return 'group' in node;
}
