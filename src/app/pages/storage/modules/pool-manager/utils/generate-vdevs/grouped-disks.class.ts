import { DiskType } from 'app/enums/disk-type.enum';
import { UnusedDisk } from 'app/interfaces/storage.interface';
import { DiskTypeSizeMap } from 'app/pages/storage/modules/pool-manager/interfaces/disk-type-size-map.interface';
import { PoolManagerTopologyCategory } from 'app/pages/storage/modules/pool-manager/store/pool-manager.store';
import { getDiskTypeSizeMap } from 'app/pages/storage/modules/pool-manager/utils/get-disk-type-size-map.utils';

/**
 * Stores disks grouped by type and size with some methods for easier interaction.
 */
export class GroupedDisks {
  private diskMap: DiskTypeSizeMap;

  constructor(private disks: UnusedDisk[]) {
    this.diskMap = getDiskTypeSizeMap(disks);
  }

  findSuitableDisks(category: PoolManagerTopologyCategory): UnusedDisk[] {
    const matchingType = this.diskMap[category.diskType];
    let matchingTypeAndSize: UnusedDisk[] = [];
    if (category.treatDiskSizeAsMinimum) {
      for (const diskSize of Object.keys(matchingType)) {
        if (category.diskSize > Number(diskSize)) continue;
        matchingTypeAndSize = matchingTypeAndSize.concat(matchingType[diskSize]);
      }
    } else {
      matchingTypeAndSize = matchingType[category.diskSize];
    }
    return matchingTypeAndSize;
  }

  removeUsedDisks(usedDisks: UnusedDisk[]): void {
    const usedDiskNames = usedDisks.map((disk) => disk.devname);

    const newDiskMap = {} as DiskTypeSizeMap;

    Object.keys(this.diskMap).forEach((diskType: DiskType) => {
      newDiskMap[diskType] = {};

      Object.keys(this.diskMap[diskType]).forEach((diskSize: string) => {
        newDiskMap[diskType][diskSize] = this.diskMap[diskType][diskSize].filter((disk) => {
          return !usedDiskNames.includes(disk.devname);
        });
      });
    });

    this.diskMap = newDiskMap;
  }
}
