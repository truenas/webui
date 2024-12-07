import { Direction } from 'app/enums/direction.enum';
import { TransferMode } from 'app/enums/transfer-mode.enum';
import { CloudSyncCredential } from 'app/interfaces/cloudsync-credential.interface';
import { DataProtectionTaskState } from 'app/interfaces/data-protection-task-state.interface';
import { Job } from 'app/interfaces/job.interface';
import { Schedule } from 'app/interfaces/schedule.interface';

export interface BwLimit {
  time: string;
  bandwidth: number;
}

export interface BwLimitUpdate {
  time: string;
  bandwidth: string;
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

export interface CloudSyncTaskUpdate extends Omit<CloudSyncTask, 'id' | 'job' | 'locked' | 'credentials' | 'encryption_salt' | 'args' | 'filename_encryption' | 'bwlimit'> {
  credentials: number;
  bwlimit: BwLimitUpdate[];
}

export interface CloudSyncTaskUi extends CloudSyncTask {
  credential: string;
  cron_schedule: string;
  frequency: string;
  next_run: string;
  next_run_time: Date | string;
  state: DataProtectionTaskState;
  last_run: string;
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
