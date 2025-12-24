import { TaskState } from './task-state.enum';

/**
 * Core job execution states from the middleware Job class.
 * These represent the lifecycle of a middleware job execution and correspond
 * directly to the 5 states defined in middleware/src/middlewared/middlewared/job.py
 *
 * Job.state can ONLY contain these 5 values - it is strictly type-enforced by the middleware.
 *
 * For task-specific states (FINISHED, ERROR, HOLD, PENDING, LOCKED), see TaskState enum.
 */
export enum JobState {
  /** Job is waiting to start execution */
  Waiting = 'WAITING',

  /** Job is currently executing */
  Running = 'RUNNING',

  /** Job completed successfully without exceptions */
  Success = 'SUCCESS',

  /** Job failed due to an exception */
  Failed = 'FAILED',

  /** Job was aborted by user or system */
  Aborted = 'ABORTED',
}

/**
 * Union type for code that needs to handle both job and task states.
 * Use this for display logic, state normalization, or utilities that work with any state value.
 */
export type DisplayableState = JobState | TaskState;
