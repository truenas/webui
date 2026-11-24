import { JobParams, JobResult } from '@truenas/api-client';
import { DatasetEncryptionType } from 'app/enums/dataset.enum';
import { Job } from 'app/interfaces/job.interface';
import { WebUiApiDirectory } from 'app/modules/websocket/typed-api/typed-api-client.token';

export interface DatasetEncryptionSummary {
  key_format: DatasetEncryptionType;
  key_present_in_database: boolean;
  locked: boolean;
  name: string;
  unlock_error: string | null;
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

/** What `zfs.resource.encryption.unlock_summary` takes. */
export type UnlockSummaryArgs = JobParams<WebUiApiDirectory, 'zfs.resource.encryption.unlock_summary'>[0];

/** Translates the unlock form's summary request into `zfs.resource.encryption.unlock_summary`. */
export function toUnlockSummaryArgs(path: string, params: DatasetEncryptionSummaryQueryParams = {}): UnlockSummaryArgs {
  const args: UnlockSummaryArgs = { path };
  if (params.key_file !== undefined) {
    args.key_file = params.key_file;
  }
  if (params.force !== undefined) {
    args.force = params.force;
  }
  if (params.datasets) {
    args.keys = params.datasets.map(({ name, key, passphrase }) => ({ path: name, key, passphrase }));
  }
  return args;
}

/**
 * Reads a `zfs.resource.encryption.unlock_summary` job into the UI's summary rows: `path` is the row's `name`, and
 * `key_format` is upper case, as `pool.dataset.encryption_summary` sent it.
 */
export function toDatasetEncryptionSummaryJob(
  job: Job<JobResult<WebUiApiDirectory, 'zfs.resource.encryption.unlock_summary'>>,
): Job<DatasetEncryptionSummary[]> {
  if (!job.result) {
    return job as unknown as Job<DatasetEncryptionSummary[]>;
  }
  return {
    ...job,
    result: job.result.map(({ path, key_format: keyFormat, ...summary }) => ({
      ...summary,
      name: path,
      key_format: keyFormat.toUpperCase() as DatasetEncryptionType,
    })),
  } as Job<DatasetEncryptionSummary[]>;
}
