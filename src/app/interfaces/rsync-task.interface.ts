import { Direction } from 'app/enums/direction.enum';
import { RsyncMode } from 'app/enums/rsync-mode.enum';
import { DataProtectionTaskState } from 'app/interfaces/data-protection-task-state.interface';
import { Job } from 'app/interfaces/job.interface';
import { KeychainSshCredentials } from 'app/interfaces/keychain-credential.interface';
import { Schedule } from 'app/interfaces/schedule.interface';
import { WebUiQueryEntity } from 'app/modules/websocket/typed-api/typed-api-client.token';

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
  remoteport: number | null;
  schedule: Schedule;
  times: boolean;
  user: string;
  ssh_credentials: KeychainSshCredentials | null;
}

export type RsyncTaskUpdate = {
  validate_rpath?: boolean;
  ssh_credentials: number;
} & Omit<RsyncTask, 'id' | 'job' | 'locked' | 'ssh_credentials'>;

export interface RsyncTaskUi extends RsyncTask {
  next_run: string;
  state: DataProtectionTaskState;
  last_run: string;
}

/**
 * Reads a `rsynctask.query` row into the shape the data protection pages are written against. The generated
 * entry spells the enums as wire literals, leaves the fields middleware defaults optional and types
 * `job` and the SSH credential as loose records; it describes the same object.
 *
 * The cast checks nothing: a regenerated entry that drops or renames a field still compiles, and
 * reads `undefined`.
 */
export function toRsyncTask(task: WebUiQueryEntity<'rsynctask.query'>): RsyncTask {
  return task as unknown as RsyncTask;
}
