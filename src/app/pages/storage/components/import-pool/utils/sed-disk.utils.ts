import { SedStatus } from 'app/enums/sed-status.enum';
import { DetailsDisk } from 'app/interfaces/disk.interface';

export interface LockedSedDisk {
  name: string;
  model: string;
  serial: string;
  size: number;
}

export function filterLockedSedDisks(disks: DetailsDisk[]): LockedSedDisk[] {
  return disks
    .filter((disk) => disk.sed_status === SedStatus.Locked)
    .map((disk) => ({
      name: disk.name,
      model: disk.model || '',
      serial: disk.serial || '',
      size: disk.size,
    }));
}
