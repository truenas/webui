import { Pool } from 'app/interfaces/pool.interface';
import { UnusedDisk } from 'app/interfaces/storage.interface';

export interface ManageUnusedDiskDialogResource {
  unusedDisks: UnusedDisk[];
  pools: Pool[];
}

export enum AddToPoolType {
  New = 'NEW',
  Existing = 'EXISTING',
}
