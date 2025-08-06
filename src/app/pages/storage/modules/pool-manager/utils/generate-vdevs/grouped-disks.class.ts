import { DiskType } from 'app/enums/disk-type.enum';
import { DetailsDisk } from 'app/interfaces/disk.interface';
import { DiskTypeSizeMap } from 'app/pages/storage/modules/pool-manager/interfaces/disk-type-size-map.interface';
import { PoolManagerTopologyCategory } from 'app/pages/storage/modules/pool-manager/store/pool-manager.store';
import { getDiskTypeSizeMap } from 'app/pages/storage/modules/pool-manager/utils/get-disk-type-size-map.utils';

/**
 * Stores disks grouped by type and size with some methods for easier interaction.
 */
export class GroupedDisks {
  private diskMap: DiskTypeSizeMap;

  constructor(disks: DetailsDisk[]) {
    this.diskMap = getDiskTypeSizeMap(disks);
  }

  findSuitableDisks(category: PoolManagerTopologyCategory): DetailsDisk[] {
    const categoryDiskSize = Number(category.diskSize);
    const diskType = category.diskType;

    if (category.treatDiskSizeAsMinimum) {
      if (diskType) {
        const matchingDisks: DetailsDisk[] = [];
        const disksByType = this.diskMap[diskType];
        for (const diskSize of Object.keys(disksByType)) {
          if (categoryDiskSize <= Number(diskSize)) {
            matchingDisks.push(...disksByType[diskSize]);
          }
        }
        return matchingDisks;
      }

      const matchingDisks: DetailsDisk[] = [];
      // Process SSD first, then HDD to avoid automatically prioritizing slower drives
      [DiskType.Ssd, DiskType.Hdd].forEach((type) => {
        const disksByType = this.diskMap[type];
        for (const diskSize of Object.keys(disksByType)) {
          if (categoryDiskSize <= Number(diskSize)) {
            matchingDisks.push(...disksByType[diskSize]);
          }
        }
      });
      return matchingDisks;
    }

    if (diskType) {
      return this.diskMap[diskType][categoryDiskSize] || [];
    }

    // When no specific disk type is selected, return SSD first to avoid
    // automatically prioritizing slower drives over faster ones
    return [...this.diskMap.SSD[categoryDiskSize] || [], ...this.diskMap.HDD[categoryDiskSize] || []];
  }

  removeUsedDisks(usedDisks: DetailsDisk[]): void {
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
