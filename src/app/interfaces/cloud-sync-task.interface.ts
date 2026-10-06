import { CallParams, CallResponse } from '@truenas/api-client';
import { Direction } from 'app/enums/direction.enum';
import { TransferMode } from 'app/enums/transfer-mode.enum';
import { CloudSyncCredential } from 'app/interfaces/cloudsync-credential.interface';
import { DataProtectionTaskState } from 'app/interfaces/data-protection-task-state.interface';
import { Job } from 'app/interfaces/job.interface';
import { Schedule } from 'app/interfaces/schedule.interface';
import { WebUiApiDirectory, WebUiQueryEntity } from 'app/modules/websocket/typed-api/typed-api-client.token';

export interface BwLimit {
  time: string;
  bandwidth: number | null;
}

export interface BwLimitUpdate {
  time: string;
  bandwidth: number | null;
}

export interface CloudSyncTask {
  args: string;
  attributes: Record<string, string | number | boolean>;
  bwlimit: BwLimit[];
  credentials: CloudSyncCredential;
  description: string;
  direction: Direction;
  enabled: boolean;
  encryption: boolean;
  encryption_password?: string;
  encryption_salt?: string;
  exclude: string[];
  filename_encryption: boolean;
  follow_symlinks: boolean;
  id: number;
  include: string[];
  job: Job | null;
  locked: boolean;
  path: string;
  post_script: string;
  pre_script: string;
  schedule: Schedule;
  snapshot: boolean;
  transfer_mode: TransferMode;
  transfers: number;
  create_empty_src_dirs: boolean;
}

export interface CloudSyncTaskUpdate extends Omit<CloudSyncTask, 'id' | 'job' | 'locked' | 'credentials' | 'encryption_salt' | 'args' | 'filename_encryption' | 'bwlimit'> {
  credentials: number;
  bwlimit: BwLimitUpdate[];
}

export interface CloudSyncTaskUi extends CloudSyncTask {
  credential: string;
  next_run: string;
  next_run_time: Date | string | null;
  next_run_sort_key: string;
  state: DataProtectionTaskState;
  last_run: string;
  last_run_sort_key: string;
  frequency_sort_key: string;
}

/** What the cloud sync forms send to `cloudsync.list_directory`. */
export type CloudSyncListDirectoryParams = CallParams<WebUiApiDirectory, 'cloudsync.list_directory'>[0];

export interface CloudSyncDirectoryListing {
  Name: string;
  IsDir: boolean;
  // The decrypted name of the file or directory
  Decrypted?: string;
}

/**
 * Reads a `cloudsync.query` row into the shape the data protection pages are written against. The generated
 * entry spells the enums as wire literals, leaves the fields middleware defaults optional, types
 * `attributes` as the provider union and `job` as a loose record; it describes the same object.
 *
 * The cast checks nothing: a regenerated entry that drops or renames a field still compiles, and
 * reads `undefined`.
 */
export function toCloudSyncTask(task: WebUiQueryEntity<'cloudsync.query'>): CloudSyncTask {
  return task as unknown as CloudSyncTask;
}

/**
 * Reads a `cloudsync.list_directory` entry. Middleware declares the entries as loose records, since
 * they are rclone's `lsjson` output passed through; this names the fields the UI reads.
 */
export function toCloudSyncDirectoryListing(
  entry: CallResponse<WebUiApiDirectory, 'cloudsync.list_directory'>[number],
): CloudSyncDirectoryListing {
  return entry as unknown as CloudSyncDirectoryListing;
}
