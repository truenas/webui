import { DiskType } from 'app/enums/disk-type.enum';
import { UnusedDisk } from 'app/interfaces/storage.interface';

export interface DiskTypeSizeMap {
  [DiskType.Hdd]: DiskTypeSizeMapItem;
  [DiskType.Ssd]: DiskTypeSizeMapItem;
}

export interface DiskTypeSizeMapItem {
  [size: string]: UnusedDisk[];
}
