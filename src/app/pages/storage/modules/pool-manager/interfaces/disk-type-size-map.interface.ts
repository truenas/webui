import { DiskType } from 'app/enums/disk-type.enum';
import { DetailsDisk } from 'app/interfaces/disk.interface';

export type DiskTypeSizeMap = Record<DiskType, DiskTypeSizeMapItem>;

export type DiskTypeSizeMapItem = Record<string, DetailsDisk[]>;
