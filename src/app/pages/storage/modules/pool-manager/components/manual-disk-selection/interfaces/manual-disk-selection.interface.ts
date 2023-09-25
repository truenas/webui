import { UnusedDisk } from 'app/interfaces/storage.interface';

// TODO: Clear out unused properties
export interface ManualSelectionDisk extends UnusedDisk {
  vdevUuid: string;
}

export interface ManualSelectionVdev {
  disks: ManualSelectionDisk[];
  uuid?: string;
}
