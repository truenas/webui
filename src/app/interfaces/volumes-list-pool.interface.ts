import { Dataset } from 'app/interfaces/dataset.interface';
import { VolumesListPool } from 'app/pages/storage-old/volumes/volumes-list/volumes-list-pool.interface';

export interface VolumesListDataset
  extends Omit<Dataset, 'compression' | 'compressratio' | 'dedup' | 'readonly' | 'comments' | 'children'> {
  non_encrypted_on_encrypted?: boolean;
  is_encrypted_root?: boolean;
  available_parsed?: string;
  used_parsed?: string;
  has_encrypted_children?: boolean;
  parent?: VolumesListPool | VolumesListDataset; // Remove VolumesListPool with StorageOld module
  is_passphrase?: boolean;

  // Overrides over Dataset
  children?: VolumesListDataset[];
  compression?: string;
  compressratio?: string;
  dedup?: string;
  readonly?: string;
  comments?: string;
}
