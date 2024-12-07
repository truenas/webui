import { marker as T } from '@biesbjerg/ngx-translate-extract-marker';
import { CloudsyncTransferSetting } from 'app/enums/cloudsync-transfer-setting.enum';
import { ApiTimestamp } from 'app/interfaces/api-date.interface';
import { CloudSyncCredential } from 'app/interfaces/cloudsync-credential.interface';
import { Job } from 'app/interfaces/job.interface';
import { Schedule } from './schedule.interface';

export interface CloudBackup {
  id: number;
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
  keep_last?: number;
  transfer_setting: CloudsyncTransferSetting;
}

export interface CloudBackupUpdate extends Omit<CloudBackup, 'id' | 'job' | 'locked' | 'credentials'> {
  credentials: number;
}

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

export type CloudBackupSnapshotDirectoryParams = [
  id: number,
  snapshot_id: string,
  path: string,
];

export interface CloudBackupSnapshotDirectoryListing {
  name: string;
  path: string;
  type: CloudBackupSnapshotDirectoryFileType;
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
