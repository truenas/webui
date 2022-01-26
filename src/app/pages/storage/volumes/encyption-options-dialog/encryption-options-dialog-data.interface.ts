import { VolumesListDataset } from 'app/pages/storage/volumes/volumes-list/volumes-list-pool.interface';

export interface EncryptionOptionsDialogData {
  row: VolumesListDataset;
  hasKeyChild: boolean;
  hasPassphraseParent: boolean;
}
