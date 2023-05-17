import { ManagerDisk } from 'app/pages/storage/components/manager/manager-disk.interface';

// TODO: Nuke
export type PoolManagerDisk = ManagerDisk;
export interface PoolManagerVdevDisk extends PoolManagerDisk {
  vdevUuid: string;
}
