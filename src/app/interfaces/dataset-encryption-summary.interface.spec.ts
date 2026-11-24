import { JobResult } from '@truenas/api-client';
import { DatasetEncryptionType } from 'app/enums/dataset.enum';
import {
  toDatasetEncryptionSummaryJob,
  toUnlockSummaryArgs,
} from 'app/interfaces/dataset-encryption-summary.interface';
import { Job } from 'app/interfaces/job.interface';
import { WebUiApiDirectory } from 'app/modules/websocket/typed-api/typed-api-client.token';

describe('dataset encryption summary', () => {
  it('translates the summary request into zfs.resource.encryption.unlock_summary', () => {
    expect(toUnlockSummaryArgs('dozer/enc')).toEqual({ path: 'dozer/enc' });
    expect(toUnlockSummaryArgs('dozer/enc', {
      key_file: false,
      force: true,
      datasets: [{ name: 'dozer/enc', passphrase: 'testtest1' }],
    })).toEqual({
      path: 'dozer/enc',
      key_file: false,
      force: true,
      keys: [{ path: 'dozer/enc', passphrase: 'testtest1', key: undefined }],
    });
  });

  it('reads summary rows by name with an upper-case key format', () => {
    const job = toDatasetEncryptionSummaryJob({
      id: 1,
      result: [{
        path: 'dozer/enc',
        key_format: 'passphrase',
        key_present_in_database: false,
        valid_key: true,
        locked: true,
        unlock_error: null,
        unlock_successful: true,
      }],
    } as Job<JobResult<WebUiApiDirectory, 'zfs.resource.encryption.unlock_summary'>>);

    expect(job.id).toBe(1);
    expect(job.result).toEqual([{
      name: 'dozer/enc',
      key_format: DatasetEncryptionType.Passphrase,
      key_present_in_database: false,
      valid_key: true,
      locked: true,
      unlock_error: null,
      unlock_successful: true,
    }]);
  });

  it('passes a job without a result through', () => {
    const job = { id: 2 } as Job<JobResult<WebUiApiDirectory, 'zfs.resource.encryption.unlock_summary'>>;
    expect(toDatasetEncryptionSummaryJob(job)).toEqual({ id: 2 });
  });
});
