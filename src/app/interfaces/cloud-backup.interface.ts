import { BwLimit } from './cloud-sync-task.interface';
import { Schedule } from './schedule.interface';

export interface CloudBackup {
  id: number;
  description: string;
  path: string;
  attributes: { folder: string }; // TODO:
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
  credentials: { id: number }; // TODO:
  job: unknown; // TODO:
  locked: boolean;
}

export interface CloudBackupUpdate extends Omit<CloudBackup, 'id' | 'job' | 'locked' | 'credentials'> {
  credentials: number;
}

export interface CloudBackupSnapshot {
  id: string;
  hostname: string;
  time: string;
  paths: string[];
}
