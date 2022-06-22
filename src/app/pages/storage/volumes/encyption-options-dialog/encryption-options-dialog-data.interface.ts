import { VolumesListDataset } from 'app/interfaces/volumes-list-pool.interface';

export interface EncryptionOptionsDialogData {
  row: VolumesListDataset;
  hasKeyChild: boolean;
  hasPassphraseParent: boolean;
}
