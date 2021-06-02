import { AlertLevel } from 'app/enums/alert-level.enum';
import { AlertServiceType } from 'app/enums/alert-service-type.enum';

export interface AlertService {
  attributes: { [attribute: string]: string | number | boolean };
  enabled: boolean;
  id: number;
  level: AlertLevel;
  name: string;
  type: AlertServiceType;
  type__title: string;
}
