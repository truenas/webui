import { CreateVdevLayout } from 'app/enums/v-dev-type.enum';
import { assertUnreachable } from 'app/helpers/assert-unreachable.utils';
import { UnusedDisk } from 'app/interfaces/storage.interface';
import { PoolManagerTopologyCategory } from 'app/pages/storage/modules/pool-manager/store/pool-manager.store';

export function categoryCapacity(topologyCategory: PoolManagerTopologyCategory, swapOnDrive: number): number {
  return topologyCategory.vdevs.reduce((sum, vdev) => {
    return sum + vdevCapacity({
      vdev,
      layout: topologyCategory.layout,
      swapOnDrive,
    });
  }, 0);
}

export function vdevCapacity({ vdev, layout, swapOnDrive }: {
  vdev: UnusedDisk[];
  layout: CreateVdevLayout;
  swapOnDrive: number;
}): number {
  if (!vdev.length) {
    return 0;
  }

  const smallestDiskSize = vdev.reduce((smallest, disk) => {
    return smallest.size < disk.size ? smallest : disk;
  }).size - swapOnDrive;

  const totalSize = smallestDiskSize * vdev.length;
  const defaultDraidDataPerGroup = 8;

  switch (layout) {
    case CreateVdevLayout.Mirror:
      return smallestDiskSize;
    case CreateVdevLayout.Raidz1:
      return totalSize - smallestDiskSize;
    case CreateVdevLayout.Raidz2:
      return totalSize - smallestDiskSize * 2;
    case CreateVdevLayout.Raidz3:
      return totalSize - smallestDiskSize * 3;

    // https://openzfs.github.io/openzfs-docs/man/7/zpoolconcepts.7.html#draid
    case CreateVdevLayout.Draid1: {
      const dataPerGroup = Math.min(defaultDraidDataPerGroup, vdev.length - 1);
      return vdev.length * (dataPerGroup / (dataPerGroup + 1)) * smallestDiskSize;
    }
    case CreateVdevLayout.Draid2: {
      const dataPerGroup = Math.min(defaultDraidDataPerGroup, vdev.length - 2);
      return vdev.length * (dataPerGroup / (dataPerGroup + 2)) * smallestDiskSize;
    }
    case CreateVdevLayout.Draid3: {
      const dataPerGroup = Math.min(defaultDraidDataPerGroup, vdev.length - 3);
      return vdev.length * (dataPerGroup / (dataPerGroup + 3)) * smallestDiskSize;
    }
    case CreateVdevLayout.Stripe:
      return vdev.reduce((sum, disk) => sum + disk.size - swapOnDrive, 0);
    default:
      assertUnreachable(layout);
      throw new Error(`Unknown layout: ${layout}`);
  }
}
