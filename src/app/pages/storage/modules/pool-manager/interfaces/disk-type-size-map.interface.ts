import { DiskType } from 'app/enums/disk-type.enum';
import { UnusedDisk } from 'app/interfaces/storage.interface';

export type DiskTypeSizeMap = {
  [type in DiskType]: DiskTypeSizeMapItem;
};

export type DiskTypeSizeMapItem = Record<string, UnusedDisk[]>;
