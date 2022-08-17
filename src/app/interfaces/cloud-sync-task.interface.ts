import { Direction } from 'app/enums/direction.enum';
import { TransferMode } from 'app/enums/transfer-mode.enum';
import { DataProtectionTaskState } from 'app/interfaces/data-protection-task-state.interface';
import { Job } from 'app/interfaces/job.interface';
import { Schedule } from 'app/interfaces/schedule.interface';

export interface CloudCredential {
  id: number;
  name: string;
  provider: string;
  attributes: { [key: string]: string | number | boolean };
}

export interface BwLimit {
  time: string;
  bandwidth: number;
}

export interface CloudSyncTask {
  args: string;
  attributes: { [key: string]: string | number | boolean };
  bwlimit: BwLimit[];
  credentials: CloudCredential;
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
  job: Job;
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

export type CloudSyncTaskUpdate = Omit<CloudSyncTask, 'id' | 'job' | 'locked'>;

export interface CloudSyncTaskUi extends CloudSyncTask {
  credential: string;
  cron_schedule: string;
  frequency: string;
  next_run: string;
  next_run_time: Date | string;
  state: DataProtectionTaskState;
}

export interface CloudSyncListDirectoryParams {
  credentials: number;
  encryption?: boolean;
  filename_encryption?: boolean;
  encryption_password?: string;
  encryption_salt?: string;
  attributes?: unknown;
  args?: string;
}

export interface CloudSyncDirectoryListing {
  Name: string;
  IsDir: boolean;
  Decrypted: boolean;
}
