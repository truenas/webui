import { Dataset } from 'app/interfaces/dataset.interface';
import { Pool } from 'app/interfaces/pool.interface';
import { VolumesListTableConfig } from 'app/pages/storage/volumes/volumes-list/volumes-list-table-config';

export interface VolumesListPool extends Pool {
  is_upgraded: boolean;
  children: VolumesListDataset[];
  volumesListTableConfig: VolumesListTableConfig;
  type: 'zpool';
  availStr: string;
  usedStr: string;
}

export interface VolumesListDataset
  extends Omit<Dataset, 'compression' | 'compressratio' | 'dedup' | 'readonly' | 'comments' | 'children'> {
  non_encrypted_on_encrypted?: boolean;
  is_encrypted_root?: boolean;
  available_parsed?: string;
  used_parsed?: string;
  has_encrypted_children?: boolean;
  parent?: VolumesListPool | VolumesListDataset;
  is_passphrase?: boolean;

  // Overrides over Dataset
  children?: VolumesListDataset[];
  compression?: string;
  compressratio?: string;
  dedup?: string;
  readonly?: string;
  comments?: string;
}
