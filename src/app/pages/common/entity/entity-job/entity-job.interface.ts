export enum EntityJobState {
  Pending = 'PENDING',
  Running = 'RUNNING',
  Hold = 'HOLD',
  Error = 'ERROR',
  Failed = 'FAILED',
  Aborted = 'ABORTED',
  Success = 'SUCCESS',
  Finished = 'FINISHED',
}

export interface EntityJob {
  abortable: boolean;
  arguments: (number | string)[];
  description: string | null;
  error: string | null;
  exc_info: { type: string; extra: string | null } | null;
  exception: string | null;
  id: number;
  logs_excerpt: string | null;
  logs_path: string | null;
  method: string;
  progress: { percent: number | null; description: string | null; extra: string | null };
  result: null;
  state: EntityJobState;
  time_finished: { $date: number } | null;
  time_started: { $date: number } | null;
}
