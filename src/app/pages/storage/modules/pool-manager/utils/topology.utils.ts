import { DiskType } from 'app/enums/disk-type.enum';
import { CreateVdevLayout, VdevType } from 'app/enums/v-dev-type.enum';
import { PoolTopology, UpdatePoolTopology } from 'app/interfaces/pool.interface';
import { Disk, UnusedDisk } from 'app/interfaces/storage.interface';
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

export function poolTopologyToStoreTopology(topology: PoolTopology, disks: Disk[]): PoolManagerTopology {
  const categories = Object.values(VdevType);

  const poolManagerTopology: PoolManagerTopology = Object.values(VdevType).reduce((topologySoFar, value) => {
    return {
      ...topologySoFar,
      [value]: {
        width: null,
        diskSize: null,
        diskType: null,
        vdevsNumber: null,
        treatDiskSizeAsMinimum: false,
        vdevs: [],
        hasCustomDiskSelection: false,
      } as PoolManagerTopologyCategory,
    };
  }, {} as PoolManagerTopology);
  for (const category of categories) {
    const vdevs = topology[category as VdevType];

    if (!vdevs || !vdevs.length) {
      continue;
    }
    const firstDisk = disks.find((disk) => disk.name === vdevs[0].children[0].disk);
    const minSize = Math.min(...(disks.map((disk) => disk.size)));
    poolManagerTopology[category as VdevType] = {
      diskType: firstDisk.type,
      diskSize: minSize,
      layout: vdevs[0].type as unknown as CreateVdevLayout,
      vdevsNumber: vdevs.length,
      width: vdevs[0].children.length,
      hasCustomDiskSelection: vdevs.some((vdev2) => vdevs[0].children.length !== vdev2.children.length),
      vdevs: topology[category as VdevType].map(
        (topologyItem) => topologyItem.children.map(
          (topologyDisk) => ({
            name: topologyDisk.disk,
            size: topologyDisk.stats.size,
            type: DiskType.Hdd,
            devname: topologyDisk.disk,
          } as UnusedDisk),
        ),
      ),
      treatDiskSizeAsMinimum: false,
    };
  }
  return poolManagerTopology;
}
