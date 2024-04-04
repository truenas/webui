import { BwLimit } from './cloud-sync-task.interface';
import { Schedule } from './schedule.interface';

export interface CloudBackup {
  id: number;
  description: string;
  path: string;
  attributes: unknown; // TODO:
  schedule: Schedule;
  pre_script: string;
  post_script: string;
  snapshot: boolean;
  bwlimit: BwLimit;
  include: string[];
  exclude: string[];
  transfers: number | null;
  args: string;
  enabled: boolean;
  password: string;
  keep_last: number;
  credentials: unknown; // TODO:
  job: unknown; // TODO:
  locked: boolean;
}

export type CloudBackupUpdate = Omit<CloudBackup, 'id' | 'job' | 'locked'>;

export interface CloudBackupSnapshot {
  id: string;
  hostname: string;
  time: string;
  paths: string[];
}
