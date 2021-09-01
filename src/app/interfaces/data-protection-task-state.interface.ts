import { JobState } from 'app/enums/job-state.enum';
import { ApiTimestamp } from 'app/interfaces/api-date.interface';

export interface DataProtectionTaskState {
  state: JobState;
  datetime?: ApiTimestamp;
  error?: string;
  reason?: string;
  warnings?: any;
  progress?: any;
  last_snapshot?: string;
}
