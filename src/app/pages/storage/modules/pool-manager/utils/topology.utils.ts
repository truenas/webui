import { VdevType } from 'app/enums/v-dev-type.enum';
import { UpdatePoolTopology } from 'app/interfaces/pool.interface';
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

export function topologyToPayload(topology: PoolManagerTopology): UpdatePoolTopology {
  const payload: UpdatePoolTopology = {};

  Object.entries(topology).forEach(([vdevType, category]: [VdevType, PoolManagerTopologyCategory]) => {
    if (vdevType === VdevType.Spare) {
      payload.spares = category.vdevs.flatMap((vdev) => {
        return vdev.map((disk) => disk.devname);
      });
      return;
    }

    payload[vdevType] = category.vdevs.map((vdev) => {
      return {
        type: category.layout,
        disks: vdev.map((disk) => disk.devname),
      };
    });
  });

  return payload;
}
