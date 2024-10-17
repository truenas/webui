import { DiskType } from 'app/enums/disk-type.enum';
import { CreateVdevLayout, TopologyItemType, VdevType } from 'app/enums/v-dev-type.enum';
import { DetailsDisk } from 'app/interfaces/disk.interface';
import { DataPoolTopologyUpdate, PoolTopology, UpdatePoolTopology } from 'app/interfaces/pool.interface';
import {
  PoolManagerTopology,
  PoolManagerTopologyCategory,
} from 'app/pages/storage/modules/pool-manager/store/pool-manager.store';

export function topologyToDisks(topology: PoolManagerTopology): DetailsDisk[] {
  return Object.values(topology).flatMap((category) => topologyCategoryToDisks(category));
}

export function topologyCategoryToDisks(topologyCategory: PoolManagerTopologyCategory): DetailsDisk[] {
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

export function poolTopologyToStoreTopology(topology: PoolTopology, disks: DetailsDisk[]): PoolManagerTopology {
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
      const parsedDraidInfo = parseDraidVdevName(vdevs[0].name);
      draidDataDisks = parsedDraidInfo.dataDisks;
      draidSpareDisks = parsedDraidInfo.spareDisks;
      layoutType = parsedDraidInfo.layout as unknown as TopologyItemType;
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
              } as DetailsDisk),
            );
          }
          return [
            { ...disks.find((disk) => disk.devname === topologyItem.disk) },
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

export function parseDraidVdevName(
  vdevName: string,
): { layout: CreateVdevLayout; dataDisks: number; spareDisks: number } {
  const regex = /draid(\d+):(\d+)d:(\d+)c:(\d+)s-(\d+)/;
  const match = vdevName.match(regex);

  if (!match) {
    throw new Error('Invalid dRAID vdev name');
  }

  const [, parityLevelNumber, dataDisks, , spareDisk] = match;
  let parityLevel: CreateVdevLayout;
  if (parityLevelNumber === '2') {
    parityLevel = CreateVdevLayout.Draid2;
  } else if (parityLevelNumber === '3') {
    parityLevel = CreateVdevLayout.Draid3;
  } else {
    parityLevel = CreateVdevLayout.Draid1;
  }

  return {
    layout: parityLevel,
    dataDisks: Number(dataDisks),
    spareDisks: Number(spareDisk),
  };
}
