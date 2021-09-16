import { AlertLevel } from 'app/enums/alert-level.enum';
import { AlertPolicy } from 'app/enums/alert-policy.enum';

export interface AlertDefaults {
  id: string;
  level: AlertLevel;
  policy: AlertPolicy;
}
