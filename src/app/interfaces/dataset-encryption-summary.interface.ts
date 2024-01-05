import { DatasetEncryptionType } from 'app/enums/dataset.enum';

export interface DatasetEncryptionSummary {
  key_format: DatasetEncryptionType;
  key_present_in_database: boolean;
  locked: boolean;
  name: string;
  unlock_error: string;
  unlock_successful: boolean;
  valid_key: boolean;
}

export interface DatasetEncryptionSummaryQueryParams {
  key_file?: boolean;
  force?: boolean;
  datasets?: DatasetEncryptionSummaryQueryParamsDataset[];
}

export interface DatasetEncryptionSummaryQueryParamsDataset {
  name: string;
  key?: string;
  passphrase?: string;
}
