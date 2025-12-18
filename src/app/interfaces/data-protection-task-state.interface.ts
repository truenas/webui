import { DisplayableState } from 'app/enums/job-state.enum';
import { ApiTimestamp } from 'app/interfaces/api-date.interface';

/**
 * State information for data protection tasks (replication, snapshots, cloud sync).
 * Tasks track their own lifecycle state separately from job execution state.
 *
 * When a task has an active job, this reflects the job's state (JobState: RUNNING, WAITING, etc.).
 * When a task has no active job, this reflects the task's lifecycle state (TaskState: FINISHED, ERROR, PENDING, etc.).
 */
export interface DataProtectionTaskState {
  /** Current state - can be either JobState (when job is active) or TaskState (task lifecycle) */
  state: DisplayableState;
  datetime?: ApiTimestamp;
  error?: string;
  reason?: string;
  warnings?: string[];
  last_snapshot?: string;
}
