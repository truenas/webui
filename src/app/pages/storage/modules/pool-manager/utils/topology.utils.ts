import { UnusedDisk } from 'app/interfaces/storage.interface';
import {
  PoolManagerTopology,
  PoolManagerTopologyCategory,
} from 'app/pages/storage/modules/pool-manager/store/pool-manager.store';

export function topologyToDisks(topology: PoolManagerTopology): UnusedDisk[] {
  return Object.values(topology).flatMap((category) => topologyCategoryToDisks(category));
}

export function topologyCategoryToDisks(topologyCategory: PoolManagerTopologyCategory): UnusedDisk[] {
  return topologyCategory.vdevs.flat();
}

export function categoryCapacity(topologyCategory: PoolManagerTopologyCategory): number {
  return topologyCategory.vdevs.reduce((sum, vdev) => {
    return sum + vdev.reduce((vdevSum, disk) => vdevSum + disk.size, 0);
  }, 0);
}
