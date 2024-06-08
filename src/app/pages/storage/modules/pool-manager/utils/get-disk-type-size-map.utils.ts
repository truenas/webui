import { DiskType } from 'app/enums/disk-type.enum';
import { DetailsDisk } from 'app/interfaces/disk.interface';
import { DiskTypeSizeMap } from 'app/pages/storage/modules/pool-manager/interfaces/disk-type-size-map.interface';

export function getDiskTypeSizeMap(disks: DetailsDisk[]): DiskTypeSizeMap {
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
