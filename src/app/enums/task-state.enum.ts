/**
 * Task lifecycle states for data protection tasks (replication, snapshots, cloud sync, etc.)
 * These states are tracked separately from Job execution states and represent the
 * overall lifecycle of long-running tasks that may span multiple job executions.
 *
 * Note: Tasks can also be in WAITING or RUNNING states when they have an active job.
 */
export enum TaskState {
  /** Task has not started or is awaiting initial execution */
  Pending = 'PENDING',

  /** Task is temporarily held (e.g., due to pool issues) */
  Hold = 'HOLD',

  /** Task encountered an error during execution (zettarepl/cloud sync specific) */
  Error = 'ERROR',

  /** Task completed successfully (zettarepl/cloud sync specific) */
  Finished = 'FINISHED',

  /** Task is locked (e.g., VMware snapshots) */
  Locked = 'LOCKED',

  /** Task is waiting to start (same as Job.Waiting but for tasks) */
  Waiting = 'WAITING',

  /** Task is currently executing (same as Job.Running but for tasks) */
  Running = 'RUNNING',
}
