import { DiskType } from 'app/enums/disk-type.enum';
import { UnusedDisk } from 'app/interfaces/storage.interface';
import { DiskTypeSizeMap } from 'app/pages/storage/modules/pool-manager/interfaces/disk-type-size-map.interface';

export function getDiskTypeSizeMap(disks: UnusedDisk[]): DiskTypeSizeMap {
  const diskMap = {
    [DiskType.Hdd]: {},
    [DiskType.Ssd]: {},
  } as DiskTypeSizeMap;

  disks.forEach((disk) => {
    if (!diskMap[disk.type][disk.size]) {
      diskMap[disk.type][disk.size] = [];
    }

    diskMap[disk.type][disk.size].push(disk);
  });

  return diskMap;
}
