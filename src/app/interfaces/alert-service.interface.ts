import { AlertLevel } from 'app/enums/alert-level.enum';
import { AlertServiceType } from 'app/enums/alert-service-type.enum';

export interface AlertServiceEdit {
  enabled?: boolean;
  level?: AlertLevel;
  name?: string;
  attributes?: {
    type?: AlertServiceType;
    [key: string]: string | number | boolean | string[] | number[] | null | undefined;
  };
}

export interface AlertService extends AlertServiceEdit {
  id: number;
  type__title: string;
}
