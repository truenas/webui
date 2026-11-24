import { JobParams, JobResult } from '@truenas/api-client';
import { Job } from 'app/interfaces/job.interface';
import { WebUiApiDirectory } from 'app/modules/websocket/typed-api/typed-api-client.token';

export interface DatasetUnlockResult {
  failed: Record<string, {
    error: string | null;
    skipped: string[];
  }>;
  unlocked: string[];
}

export interface DatasetUnlockParams {
  datasets?: { name: string; key?: string; passphrase?: string }[];
  key_file?: boolean;
  force?: boolean;
  recursive?: boolean;
  toggle_attachments?: boolean;
}

/** What `zfs.resource.encryption.unlock` takes. */
export type UnlockArgs = JobParams<WebUiApiDirectory, 'zfs.resource.encryption.unlock'>[0];

/**
 * Translates the unlock form's request into `zfs.resource.encryption.unlock`: each entry of `datasets` becomes a
 * `keys` entry by `path`, and `toggle_attachments` is `start_attachments`.
 */
export function toUnlockArgs(path: string, params: DatasetUnlockParams): UnlockArgs {
  const args: UnlockArgs = { path };
  if (params.recursive !== undefined) {
    args.recursive = params.recursive;
  }
  if (params.force !== undefined) {
    args.force = params.force;
  }
  if (params.key_file !== undefined) {
    args.key_file = params.key_file;
  }
  if (params.datasets) {
    args.keys = params.datasets.map(({ name, key, passphrase }) => ({ path: name, key, passphrase }));
  }
  if (params.toggle_attachments !== undefined) {
    args.start_attachments = params.toggle_attachments;
  }
  return args;
}

/** Reads a `zfs.resource.encryption.unlock` job into `DatasetUnlockResult`, which it matches field for field. */
export function toDatasetUnlockJob(
  job: Job<JobResult<WebUiApiDirectory, 'zfs.resource.encryption.unlock'>>,
): Job<DatasetUnlockResult> {
  return job as Job<DatasetUnlockResult>;
}
