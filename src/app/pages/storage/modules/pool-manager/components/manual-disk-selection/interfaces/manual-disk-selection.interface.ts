import { UnusedDisk } from 'app/interfaces/storage.interface';

// TODO: Clear out unused properties
export interface ManualSelectionDisk extends UnusedDisk {
  vdevUuid: string;
  real_capacity: number;
}

export interface ManualSelectionVdev {
  disks: ManualSelectionDisk[];
  uuid?: string;
  showDiskSizeError: boolean;
  rawSize: number;
  vdevDisksError: boolean;
  errorMsg: string;
}
