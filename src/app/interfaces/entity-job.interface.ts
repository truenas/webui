import { EntityJobState } from 'app/enums/entity-job-state.enum';
import { ApiTimestamp } from 'app/interfaces/api-date.interface';

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
  time_finished: ApiTimestamp;
  time_started: ApiTimestamp;
}
