import { JobMethod } from '@truenas/api-client';
import { JobState } from 'app/enums/job-state.enum';
import { JobExceptionType } from 'app/enums/response-error-type.enum';
import { ApiTimestamp } from 'app/interfaces/api-date.interface';
import { Credentials } from 'app/interfaces/credential-type.interface';
import { WebUiApiDirectory } from 'app/modules/websocket/typed-api/typed-api-client.token';

/**
 * Jobs middleware starts by itself and the UI watches for in `core.get_jobs`. They cannot be
 * called, so the generated job directory does not list them.
 */
type InternalJobMethod = 'failover.events.vrrp_master';

export interface Job<R = unknown, A = unknown[]> {
  abortable: boolean;
  arguments: A;
  transient: boolean;
  description: string | null;
  error: string | null;
  extra?: Record<string, unknown>;
  exc_info: {
    type?: JobExceptionType | null;
    extra: string | number | boolean | unknown[] | Record<string, unknown>;
    repr?: string;
  } | null;
  exception: string;
  id: number;
  logs_excerpt: string;
  credentials: Credentials | null;
  logs_path: string;
  method: JobMethod<WebUiApiDirectory> | InternalJobMethod;
  progress: JobProgress;
  result: R;
  state: JobState;
  time_finished: ApiTimestamp | null;
  time_started: ApiTimestamp;
  removed: boolean;
  message_ids: string[];
}

export interface JobProgress {
  percent: number;
  description: string;
  extra: string;
}
