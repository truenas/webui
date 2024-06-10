import { DetailsDisk } from 'app/interfaces/disk.interface';

// TODO: Clear out unused properties
export interface ManualSelectionDisk extends DetailsDisk {
  vdevUuid: string;
}

export interface ManualSelectionVdev {
  disks: ManualSelectionDisk[];
  uuid?: string;
}
