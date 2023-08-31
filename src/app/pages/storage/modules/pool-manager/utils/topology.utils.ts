import { DiskType } from 'app/enums/disk-type.enum';
import { CreateVdevLayout, TopologyItemType, VdevType } from 'app/enums/v-dev-type.enum';
import { DataPoolTopologyUpdate, PoolTopology, UpdatePoolTopology } from 'app/interfaces/pool.interface';
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
      let typePayload = {
        type: category.layout,
        disks: vdev.map((disk) => disk.devname),
      };

      if (isDraidLayout(category.layout)) {
        typePayload = {
          ...typePayload,
          draid_data_disks: category.draidDataDisks,
          draid_spare_disks: category.draidSpareDisks,
        } as DataPoolTopologyUpdate;
      }

      return typePayload;
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

    if (!vdevs?.length) {
      continue;
    }
    let layoutType: TopologyItemType = vdevs[0].type;
    let width = vdevs[0].children.length;

    if (!vdevs[0].children.length && layoutType === TopologyItemType.Disk) {
      layoutType = TopologyItemType.Stripe;
      width = 1;
    }
    const minSize = Math.min(...(disks.map((disk) => disk.size)));

    let draidDataDisks: number = null;
    let draidSpareDisks: number = null;

    if (vdevs[0].type === TopologyItemType.Draid) {
      draidDataDisks = vdevs[0].stats.draid_data_disks;
      draidSpareDisks = vdevs[0].stats.draid_spare_disks;
      switch (vdevs[0].stats.draid_parity) {
        case 2:
          layoutType = CreateVdevLayout.Draid2 as unknown as TopologyItemType;
          break;
        case 3:
          layoutType = CreateVdevLayout.Draid3 as unknown as TopologyItemType;
          break;
        default:
          layoutType = CreateVdevLayout.Draid1 as unknown as TopologyItemType;
          break;
      }
    }

    poolManagerTopology[category as VdevType] = {
      diskType: disks[0].type,
      diskSize: minSize,
      layout: layoutType as unknown as CreateVdevLayout,
      vdevsNumber: vdevs.length,
      width,
      hasCustomDiskSelection: vdevs.some((vdev) => vdevs[0].children.length !== vdev.children.length),
      vdevs: topology[category as VdevType].map(
        (topologyItem) => {
          if (topologyItem.children.length) {
            return topologyItem.children.map(
              (topologyDisk) => ({
                name: topologyDisk.disk,
                size: topologyDisk.stats.size,
                type: DiskType.Hdd,
                devname: topologyDisk.disk,
              } as UnusedDisk),
            );
          }
          return [
            disks.find((disk) => disk.devname === topologyItem.disk) as UnusedDisk,
          ];
        },
      ),
      treatDiskSizeAsMinimum: false,
      draidDataDisks,
      draidSpareDisks,
    };
  }
  return poolManagerTopology;
}

export function isDraidLayout(layout: CreateVdevLayout | TopologyItemType): boolean {
  return [
    CreateVdevLayout.Draid1,
    CreateVdevLayout.Draid2,
    CreateVdevLayout.Draid3,
    TopologyItemType.Draid,
  ].includes(layout);
}
