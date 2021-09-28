import { JobState } from 'app/enums/job-state.enum';
import { ResponseErrorType } from 'app/enums/response-error-type.enum';
import { ApiTimestamp } from 'app/interfaces/api-date.interface';
import { ApiMethod } from 'app/interfaces/api-directory.interface';

export interface Job<R = null, A = unknown[]> {
  abortable: boolean;
  arguments: A;
  description: string;
  error: string;
  exc_info: {
    type: ResponseErrorType | null;
    extra: Record<string, unknown>;
  };
  exception: string;
  id: number;
  logs_excerpt: string;
  logs_path: string;
  method: ApiMethod;
  progress: JobProgress;
  result: R;
  state: JobState;
  time_finished: ApiTimestamp;
  time_started: ApiTimestamp;
}

export interface JobProgress {
  percent: number;
  description: string;
  extra: string;
}
