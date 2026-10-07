import { JobResult } from '@truenas/api-client';
import { DatasetEncryptionType } from 'app/enums/dataset.enum';
import { Job } from 'app/interfaces/job.interface';
import { WebUiApiDirectory } from 'app/modules/websocket/typed-api/typed-api-client.token';

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

/**
 * Reads a `pool.dataset.encryption_summary` job into the UI's summary rows. The generated entry types
 * `key_format` as a plain string where the UI reads it as `DatasetEncryptionType`; it describes the same object.
 */
export function toDatasetEncryptionSummaryJob(
  job: Job<JobResult<WebUiApiDirectory, 'pool.dataset.encryption_summary'>>,
): Job<DatasetEncryptionSummary[]> {
  return job as Job<DatasetEncryptionSummary[]>;
}
