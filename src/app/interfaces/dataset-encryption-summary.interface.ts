import { DatasetEncryptionType } from 'app/enums/dataset-encryption-type.enum';

export interface DatasetEncryptionSummary {
  key_format: DatasetEncryptionType;
  key_present_in_database: boolean;
  locked: boolean;
  name: string;
  unlock_error: string;
  unlock_successful: boolean;
  valid_key: boolean;
}

export interface DatasetEncryptedRootKeys {
  [mountpoint: string]: string;
}
