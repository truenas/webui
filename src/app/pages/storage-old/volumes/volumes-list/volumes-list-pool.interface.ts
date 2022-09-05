import { Pool } from 'app/interfaces/pool.interface';
import { VolumesListDataset } from 'app/interfaces/volumes-list-pool.interface';
import { VolumesListTableConfig } from 'app/pages/storage-old/volumes/volumes-list/volumes-list-table-config';

export interface VolumesListPool extends Pool {
  children: VolumesListDataset[];
  volumesListTableConfig: VolumesListTableConfig;
  type: 'zpool';
  availStr: string;
  usedStr: string;
}
