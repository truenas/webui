import { Direction } from 'app/enums/direction.enum';
import { RsyncMode } from 'app/enums/rsync-mode.enum';
import { DataProtectionTaskState } from 'app/interfaces/data-protection-task-state.interface';
import { Job } from 'app/interfaces/job.interface';
import { Schedule } from 'app/interfaces/schedule.interface';

export interface RsyncTask {
  archive: boolean;
  compress: boolean;
  delayupdates: boolean;
  delete: boolean;
  desc: string;
  direction: Direction;
  enabled: boolean;
  extra: string[];
  id: number;
  job: Job;
  locked: boolean;
  mode: RsyncMode;
  path: string;
  preserveattr: boolean;
  preserveperm: boolean;
  quiet: boolean;
  recursive: boolean;
  remotehost: string;
  remotemodule: string;
  remotepath: string;
  remoteport: number;
  schedule: Schedule;
  times: boolean;
  user: string;
}

export type RsyncTaskUpdate = {
  validate_rpath?: boolean;
} & Omit<RsyncTask, 'id' | 'job' | 'locked'>;

export interface RsyncTaskUi extends RsyncTask {
  cron_schedule: string;
  next_run: string;
  frequency: string;
  state: DataProtectionTaskState;
}
