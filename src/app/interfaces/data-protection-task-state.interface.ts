import { EntityJobState } from 'app/enums/entity-job-state.enum';
import { ApiTimestamp } from 'app/interfaces/api-date.interface';

export interface DataProtectionTaskState {
  state: EntityJobState;
  datetime?: ApiTimestamp;
  error?: string;
  warnings?: any;
  progress?: any;
  last_snapshot?: string;
}
