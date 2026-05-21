import { DetailsDisk } from 'app/interfaces/disk.interface';
import { Zpool } from 'app/interfaces/zpool.interface';

export interface ManageUnusedDiskDialogResource {
  unusedDisks: DetailsDisk[];
  pools: Zpool[];
}

export enum AddToPoolType {
  New = 'NEW',
  Existing = 'EXISTING',
}
