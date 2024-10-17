import { CreateVdevLayout } from 'app/enums/v-dev-type.enum';
import { assertUnreachable } from 'app/helpers/assert-unreachable.utils';
import { DetailsDisk } from 'app/interfaces/disk.interface';
import { PoolManagerTopologyCategory } from 'app/pages/storage/modules/pool-manager/store/pool-manager.store';

export function categoryCapacity(topologyCategory: PoolManagerTopologyCategory): number {
  return topologyCategory.vdevs.reduce((sum, vdev) => {
    return sum + vdevCapacity({
      vdev,
      layout: topologyCategory.layout,
      draidDataDisks: topologyCategory.draidDataDisks,
      draidSpareDisks: topologyCategory.draidSpareDisks,
    });
  }, 0);
}

export function vdevCapacity({
  vdev, layout, draidDataDisks, draidSpareDisks,
}: {
  vdev: DetailsDisk[];
  layout: CreateVdevLayout;
  draidDataDisks?: number;
  draidSpareDisks?: number;
}): number {
  if (!vdev.length || !layout) {
    return 0;
  }

  const smallestDiskSize = vdev.reduce((smallest, disk) => {
    return smallest?.size < disk.size ? smallest : disk;
  }, undefined).size;

  const totalSize = smallestDiskSize * vdev.length;

  switch (layout) {
    case CreateVdevLayout.Mirror:
      return smallestDiskSize;
    case CreateVdevLayout.Raidz1:
      return totalSize - smallestDiskSize;
    case CreateVdevLayout.Raidz2:
      return totalSize - smallestDiskSize * 2;
    case CreateVdevLayout.Raidz3:
      return totalSize - smallestDiskSize * 3;
    case CreateVdevLayout.Draid1:
      return dRaidCapacity({
        children: vdev.length,
        dataPerGroup: draidDataDisks,
        parity: 1,
        spares: draidSpareDisks,
        size: smallestDiskSize,
      });
    case CreateVdevLayout.Draid2:
      return dRaidCapacity({
        children: vdev.length,
        dataPerGroup: draidDataDisks,
        parity: 2,
        spares: draidSpareDisks,
        size: smallestDiskSize,
      });
    case CreateVdevLayout.Draid3:
      return dRaidCapacity({
        children: vdev.length,
        dataPerGroup: draidDataDisks,
        parity: 3,
        spares: draidSpareDisks,
        size: smallestDiskSize,
      });
    case CreateVdevLayout.Stripe:
      return vdev.reduce((sum, disk) => sum + disk.size, 0);
    default:
      assertUnreachable(layout);
      return 0;
  }
}

/**
 * https://openzfs.github.io/openzfs-docs/man/7/zpoolconcepts.7.html#draid
 */
function dRaidCapacity(values: {
  children: number;
  dataPerGroup: number;
  parity: number;
  size: number;
  spares: number;
}): number {
  return (values.children - values.spares)
    * (values.dataPerGroup / (values.dataPerGroup + values.parity))
    * values.size;
}
