import { AlertClassName } from 'app/enums/alert-class-name.enum';
import { AlertLevel } from 'app/enums/alert-level.enum';
import { AlertPolicy } from 'app/enums/alert-policy.enum';
import { ApiTimestamp } from 'app/interfaces/api-date.interface';

export interface Alert {
  args: unknown;
  datetime: ApiTimestamp;
  dismissed: boolean;
  formatted: string;
  id: string;
  key: string;
  klass: AlertClassName;
  last_occurrence: ApiTimestamp;
  level: AlertLevel;
  mail: string;
  node: string;
  one_shot: boolean;
  source: string;
  text: string;
  uuid: string;
}

export interface AlertCategory {
  id: string;
  title: string;
  classes: AlertClass[];
}

export interface AlertClass {
  id: AlertClassName;
  level: AlertLevel;
  title: string;
  proactive_support?: boolean;
}

export interface AlertClassSettings {
  level?: AlertLevel;
  policy?: AlertPolicy;
}

export interface AlertClasses {
  id: number;
  classes: Record<string, AlertClassSettings>;
}

export type AlertClassesUpdate = Omit<AlertClasses, 'id'>;
