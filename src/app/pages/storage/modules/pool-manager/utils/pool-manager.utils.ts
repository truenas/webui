import { UnusedDisk } from 'app/interfaces/storage.interface';
import { SizeDisksMap } from 'app/pages/storage/modules/pool-manager/interfaces/size-disks-map.interface';

export function getSizeDisksMap(unusedDisks: UnusedDisk[]): SizeDisksMap {
  return unusedDisks.reduce((acc, disk) => {
    return acc[disk.size] ? { ...acc, [disk.size]: acc[disk.size] + 1 } : { ...acc, [disk.size]: 1 };
  }, {} as SizeDisksMap);
}
