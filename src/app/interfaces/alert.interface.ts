import { ApiTimestamp } from 'app/interfaces/api-date.interface';
import { AlertLevel } from 'app/enums/alert-level.enum';

export interface Alert {
  args: string;
  datetime: ApiTimestamp;
  dismissed: boolean;
  formatted: string;
  id: string;
  key: string;
  klass: string;
  last_occurrence: ApiTimestamp;
  level: AlertLevel;
  mail: string;
  node: string;
  one_shot: boolean;
  source: string;
  text: string;
  uuid: string;
}
