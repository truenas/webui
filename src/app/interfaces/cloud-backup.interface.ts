import { Job } from 'app/interfaces/job.interface';
import { BwLimit, CloudCredential } from './cloud-sync-task.interface';
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
  transfers: number | null;
  args: string;
  enabled: boolean;
  password: string;
  credentials: CloudCredential | number;
  job: Job | null;
  locked: boolean;
  bwlimit?: BwLimit;
  keep_last?: number;
}

export type CloudBackupUpdate = Omit<CloudBackup, 'id' | 'job' | 'locked'>;

export interface CloudBackupSnapshot {
  id: string;
  hostname: string;
  time: string;
  paths: string[];
}

export enum SnapshotIncludeExclude {
  IncludeEverything = 'includeEverything',
  IncludeFromSubFolder = 'includeFromSubFolder',
  ExcludePaths = 'excludePaths',
  ExcludeByPattern = 'excludeByPattern',
}
