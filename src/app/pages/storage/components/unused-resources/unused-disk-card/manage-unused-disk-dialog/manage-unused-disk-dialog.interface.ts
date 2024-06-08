import { DetailsDisk } from 'app/interfaces/disk.interface';
import { Pool } from 'app/interfaces/pool.interface';

export interface ManageUnusedDiskDialogResource {
  unusedDisks: DetailsDisk[];
  pools: Pool[];
}

export enum AddToPoolType {
  New = 'NEW',
  Existing = 'EXISTING',
}
