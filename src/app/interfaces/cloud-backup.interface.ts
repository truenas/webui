import { marker as T } from '@biesbjerg/ngx-translate-extract-marker';
import { CallResponse, CallParams } from '@truenas/api-client';
import { CloudsyncTransferSetting } from 'app/enums/cloudsync-transfer-setting.enum';
import { ApiTimestamp } from 'app/interfaces/api-date.interface';
import { CloudSyncCredential } from 'app/interfaces/cloudsync-credential.interface';
import { Job } from 'app/interfaces/job.interface';
import { WebUiApiDirectory, WebUiQueryEntity } from 'app/modules/websocket/typed-api/typed-api-client.token';
import { Schedule } from './schedule.interface';

export interface CloudBackup {
  id: number;
  absolute_paths: boolean;
  description: string;
  path: string;
  attributes: Record<string, string | number | boolean>;
  schedule: Schedule;
  pre_script: string;
  post_script: string;
  snapshot: boolean;
  include: string[];
  exclude: string[];
  args: string;
  enabled: boolean;
  password: string;
  credentials: CloudSyncCredential;
  job: Job | null;
  locked: boolean;
  transfer_setting: CloudsyncTransferSetting;
  cache_path: string | null;
  keep_last?: number;
  rate_limit: number | null;
}

/** What the cloud backup form sends, to `cloud_backup.create` and `cloud_backup.update` alike. */
export type CloudBackupUpdate = CallParams<WebUiApiDirectory, 'cloud_backup.create'>[0];

export interface CloudBackupSnapshot {
  id: string;
  short_id: string;
  hostname: string;
  paths: string[];
  parent: string;
  username: string;
  time: {
    $date: number;
  };
  tree: string;
  program_version: string;
}

export enum SnapshotIncludeExclude {
  IncludeEverything = 'includeEverything',
  IncludeFromSubFolder = 'includeFromSubFolder',
  ExcludePaths = 'excludePaths',
  ExcludeByPattern = 'excludeByPattern',
}

export const snapshotIncludeExcludeOptions = new Map<SnapshotIncludeExclude, string>([
  [SnapshotIncludeExclude.IncludeEverything, T('Include everything')],
  [SnapshotIncludeExclude.IncludeFromSubFolder, T('Include from subfolder')],
  [SnapshotIncludeExclude.ExcludePaths, T('Select paths to exclude')],
  [SnapshotIncludeExclude.ExcludeByPattern, T('Exclude by pattern')],
]);

export type CloudBackupRestoreParams = [
  id: number,
  snapshot_id: string,
  subfolder: string,
  destination_path: string,
  settings: {
    exclude: string[];
    include?: string[];
  },
];

export enum CloudBackupSnapshotDirectoryFileType {
  File = 'file',
  Dir = 'dir',
}

export interface BackupTile {
  title: string;
  totalSend: number;
  totalReceive: number;
  failedSend: number;
  failedReceive: number;
  lastWeekSend: number;
  lastWeekReceive: number;
  lastSuccessfulTask: ApiTimestamp;
}

/**
 * Reads a `cloud_backup.query` row into the shape the data protection pages are written against. The generated
 * entry spells the enums as wire literals, leaves the fields middleware defaults optional, types
 * `attributes` as the provider union and `job` as a loose record; it describes the same object.
 *
 * A plain `as` does not compile here: `attributes` is the provider union, which has no index
 * signature to compare with the UI's record. So the cast checks nothing, and a regenerated entry
 * that drops or renames a field still compiles and reads `undefined`.
 */
export function toCloudBackup(cloudBackup: WebUiQueryEntity<'cloud_backup.query'>): CloudBackup {
  return cloudBackup as unknown as CloudBackup;
}

/**
 * Reads a `cloud_backup.list_snapshots` row. The generated type declares `time` as a string where
 * middleware sends a `{ $date }` envelope (gap 15 in docs/devs/typed-api-client.md), and leaves out
 * the restic fields the UI does not read either.
 */
export function toCloudBackupSnapshot(
  snapshot: CallResponse<WebUiApiDirectory, 'cloud_backup.list_snapshots'>[number],
): CloudBackupSnapshot {
  return snapshot as unknown as CloudBackupSnapshot;
}
