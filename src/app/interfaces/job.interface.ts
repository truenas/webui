import { JobState } from 'app/enums/job-state.enum';
import { JobExceptionType } from 'app/enums/response-error-type.enum';
import { ApiJobMethod } from 'app/interfaces/api/api-job-directory.interface';
import { ApiTimestamp } from 'app/interfaces/api-date.interface';
import { Credentials } from 'app/interfaces/credential-type.interface';

export interface Job<R = unknown, A = unknown[]> {
  abortable: boolean;
  arguments: A;
  transient: boolean;
  description: string;
  error: string;
  extra?: Record<string, unknown>;
  exc_info: {
    type?: JobExceptionType | null;
    extra: string | number | boolean | unknown[] | Record<string, unknown>;
    repr?: string;
  };
  exception: string;
  id: number;
  logs_excerpt: string;
  credentials: Credentials | null;
  logs_path: string;
  method: ApiJobMethod;
  progress: JobProgress;
  result: R;
  state: JobState;
  time_finished: ApiTimestamp | null;
  time_started: ApiTimestamp;
}

export interface JobProgress {
  percent: number;
  description: string;
  extra: string;
}
