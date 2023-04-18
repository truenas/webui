import { DiskType } from 'app/enums/disk-type.enum';

export interface SizeDisksMap {
  [DiskType.Hdd]: SizeDisksMapItem;
  [DiskType.Ssd]: SizeDisksMapItem;
}

export interface SizeDisksMapItem {
  [size: string]: number;
}
