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
    if (category.treatDiskSizeAsMinimum) {
      const matchingDisks: DetailsDisk[] = [];
      [DiskType.Hdd, DiskType.Ssd].forEach((type) => {
        const disksByType = this.diskMap[type];
        for (const diskSize of Object.keys(disksByType)) {
          if (category.diskSize <= Number(diskSize)) {
            matchingDisks.push(...disksByType[diskSize]);
          }
        }
      });
      return matchingDisks;
    }

    return [...this.diskMap.HDD[category.diskSize] || [], ...this.diskMap.SSD[category.diskSize] || []];
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
