import { JobResult } from '@truenas/api-client';
import { Job } from 'app/interfaces/job.interface';
import { WebUiApiDirectory } from 'app/modules/websocket/typed-api/typed-api-client.token';

export interface DatasetUnlockResult {
  failed: Record<string, {
    error: string;
    skipped: string[];
  }>;
  unlocked: string[];
}

export interface DatasetUnlockParams {
  datasets: { name: string; key?: string; passphrase: string }[];
  key_file: boolean;
  recursive: boolean;
  toggle_attachments?: boolean;
}

/**
 * Reads a `pool.dataset.unlock` job into `DatasetUnlockResult`. Middleware declares `failed` as a loose
 * record; the UI names the `error` and `skipped` each failed dataset carries.
 */
export function toDatasetUnlockJob(
  job: Job<JobResult<WebUiApiDirectory, 'pool.dataset.unlock'>>,
): Job<DatasetUnlockResult> {
  return job as Job<DatasetUnlockResult>;
}
