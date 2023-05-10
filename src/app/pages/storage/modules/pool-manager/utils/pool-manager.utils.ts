import { UnusedDisk } from 'app/interfaces/storage.interface';
import { SizeDisksMapItem } from 'app/pages/storage/modules/pool-manager/interfaces/size-disks-map.interface';
import {
  PoolManagerTopology,
  PoolManagerTopologyCategory,
} from 'app/pages/storage/modules/pool-manager/store/pool-manager.store';

export function getSizeDisksMap(unusedDisks: UnusedDisk[]): SizeDisksMapItem {
  return unusedDisks.reduce((acc, disk) => {
    return acc[disk.size] ? { ...acc, [disk.size]: acc[disk.size] + 1 } : { ...acc, [disk.size]: 1 };
  }, {} as SizeDisksMapItem);
}

export function hasNonUniqueSerial(disk: UnusedDisk): boolean {
  return Boolean(disk.duplicate_serial.length);
}

export function hasExportedPool(disk: UnusedDisk): boolean {
  return Boolean(disk.exported_zpool);
}

export function isSafeDisk(disk: UnusedDisk): boolean {
  return !hasNonUniqueSerial(disk) && !hasExportedPool(disk);
}

export function topologyToDiskNames(topology: PoolManagerTopology): string[] {
  return Object.values(topology).flatMap((category) => topologyCategoryToDiskNames(category));
}

export function topologyCategoryToDiskNames(topologyCategory: PoolManagerTopologyCategory): string[] {
  return topologyCategory.vdevs.flat();
}

/**
 * Given array of disks, returns disks not present in `diskNames`.
 */
export function differenceByDiskName(disks: UnusedDisk[], diskNames: string[]): UnusedDisk[] {
  return disks.filter((disk) => diskNames.includes(disk.devname));
}
