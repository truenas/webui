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
  description: string;
  error: string;
  exc_info: { type: string; extra: string };
  exception: string;
  id: number;
  logs_excerpt: string;
  logs_path: string;
  method: string;
  progress: { percent: number; description: string; extra: string };
  result: string;
  state: EntityJobState;
  time_finished: { $date: number };
  time_started: { $date: number };
}
